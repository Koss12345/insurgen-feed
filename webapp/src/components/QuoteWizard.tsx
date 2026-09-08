"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { INSURANCE_TYPES, getInsuranceTypeConfig, isInsuranceType } from "@/lib/insurers/fields";
import type { InsuranceType, Quote, QuoteParamValue } from "@/lib/insurers/types";
import { trackEvent } from "@/lib/analytics";

type Step = "type" | "form" | "quotes" | "contact" | "success";
type SortOrder = "asc" | "desc";

const STEP_ORDER: Step[] = ["type", "form", "quotes", "contact"];
const DRAFT_KEY = "quote-draft";

function defaultParams(type: InsuranceType): Record<string, QuoteParamValue> {
  const config = getInsuranceTypeConfig(type);
  const params: Record<string, QuoteParamValue> = {};
  config?.fields.forEach((field) => {
    params[field.name] = field.defaultValue;
  });
  return params;
}

function loadDraft(): { type: InsuranceType; params: Record<string, QuoteParamValue> } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.type === "string" && isInsuranceType(parsed.type) && typeof parsed.params === "object") {
      return { type: parsed.type, params: parsed.params };
    }
  } catch {
    // localStorage can throw (private mode, disabled) or hold garbage — a missing draft is fine.
  }
  return null;
}

const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });

export default function QuoteWizard({ initialType }: { initialType?: string }) {
  const startType = initialType && isInsuranceType(initialType) ? initialType : undefined;

  // Restore an in-progress draft when landing on /quote with no explicit
  // type in the URL. useState's lazy initializer runs exactly once (unlike
  // useMemo, which is only a performance hint), so this is a safe place
  // for the one-time localStorage read.
  const [initialDraft] = useState(() => (startType ? null : loadDraft()));

  const [step, setStep] = useState<Step>(startType || initialDraft ? "form" : "type");
  const [type, setType] = useState<InsuranceType | undefined>(startType ?? initialDraft?.type);
  const [params, setParams] = useState<Record<string, QuoteParamValue>>(
    startType ? defaultParams(startType) : (initialDraft?.params ?? {}),
  );
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [website, setWebsite] = useState(""); // honeypot
  const [consent, setConsent] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftIdRef = useRef<string | null>(null);

  const config = useMemo(() => (type ? getInsuranceTypeConfig(type) : undefined), [type]);

  const cheapestId = useMemo(
    () => (quotes.length ? quotes.reduce((a, b) => (b.premium < a.premium ? b : a)).insurerId : null),
    [quotes],
  );
  const sortedQuotes = useMemo(
    () => [...quotes].sort((a, b) => (sortOrder === "asc" ? a.premium - b.premium : b.premium - a.premium)),
    [quotes, sortOrder],
  );

  // Autosave the anket (not contact details) so a visitor who navigates away can pick up where they left off.
  useEffect(() => {
    if (!type) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ type, params }));
    } catch {
      // Best-effort only.
    }
  }, [type, params]);

  // Debounced draft save of the contact step, so a manager can follow up even if the visitor never submits.
  useEffect(() => {
    if (step !== "contact" || !type || !selectedQuote) return;
    if (!contact.name.trim() && !contact.phone.trim()) return;

    const timer = setTimeout(() => {
      fetch("/api/leads/partial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftIdRef.current,
          type,
          params,
          quote: selectedQuote,
          contact,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.id) draftIdRef.current = data.id;
        })
        .catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [step, type, params, selectedQuote, contact]);

  function chooseType(next: InsuranceType) {
    setType(next);
    setParams(defaultParams(next));
    setStep("form");
    setError(null);
  }

  async function submitForm() {
    if (!type) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, params }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuotes(data.quotes ?? []);
      setSortOrder("asc");
      setStep("quotes");
      trackEvent("quote_viewed", { type });
    } catch {
      setError("Не удалось получить предложения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  function chooseQuote(quote: Quote) {
    setSelectedQuote(quote);
    setStep("contact");
    setError(null);
  }

  async function submitApplication() {
    if (!type || !selectedQuote) return;
    if (website) return; // honeypot tripped — silently drop
    if (!consent) {
      setError("Нужно согласие на обработку персональных данных");
      return;
    }
    if (contact.name.trim().length < 2 || contact.phone.trim().length < 5) {
      setError("Укажите имя и телефон");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          params,
          quote: selectedQuote,
          contact: {
            name: contact.name.trim(),
            phone: contact.phone.trim(),
            email: contact.email.trim() || undefined,
          },
          consent: true,
          draftId: draftIdRef.current,
          website,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setApplicationId(data.id);
      setStep("success");
      trackEvent("lead_submitted", { type, insurerId: selectedQuote.insurerId });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Best-effort only.
      }
    } catch {
      setError("Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  const currentStepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {step !== "success" && (
        <div className="mb-8 flex items-center gap-2" aria-label={`Шаг ${currentStepIndex + 1} из ${STEP_ORDER.length}`}>
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= currentStepIndex ? "bg-accent" : "bg-line"}`}
            />
          ))}
        </div>
      )}

      {step === "type" && (
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">Какой полис подобрать?</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {INSURANCE_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => chooseType(t.id)}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-left hover:border-accent"
              >
                <span className="text-2xl" aria-hidden>
                  {t.icon}
                </span>
                <span className="font-medium text-ink">{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "form" && config && (
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            {config.icon} {config.title}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Заполните параметры, чтобы получить цены</p>

          <div className="mt-6 space-y-4">
            {config.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-ink" htmlFor={field.name}>
                  {field.label}
                </label>
                {field.kind === "number" && (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id={field.name}
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={Number(params[field.name] ?? field.defaultValue)}
                      onChange={(e) =>
                        setParams((p) => ({ ...p, [field.name]: Number(e.target.value) }))
                      }
                      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
                    />
                    {field.suffix && <span className="text-sm text-ink-soft">{field.suffix}</span>}
                  </div>
                )}
                {field.kind === "select" && (
                  <select
                    id={field.name}
                    value={String(params[field.name] ?? field.defaultValue)}
                    onChange={(e) => setParams((p) => ({ ...p, [field.name]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {field.kind === "checkbox" && (
                  <label className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                    <input
                      id={field.name}
                      type="checkbox"
                      checked={Boolean(params[field.name])}
                      onChange={(e) => setParams((p) => ({ ...p, [field.name]: e.target.checked }))}
                    />
                    Да
                  </label>
                )}
              </div>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep("type")}
              className="rounded-full border border-line px-5 py-2 text-sm text-ink-soft hover:border-accent"
            >
              Назад
            </button>
            <button
              onClick={submitForm}
              disabled={loading}
              className="rounded-full bg-accent px-6 py-2 font-medium text-white hover:bg-accent-ink disabled:opacity-60"
            >
              {loading ? "Считаем..." : "Показать цены"}
            </button>
          </div>
        </div>
      )}

      {step === "quotes" && (
        <div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-serif text-2xl font-bold text-ink">Предложения</h1>
            {quotes.length > 1 && (
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink"
              >
                <option value="asc">Сначала дешевле</option>
                <option value="desc">Сначала дороже</option>
              </select>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Ориентировочная стоимость на основе введённых данных. Точная цена подтверждается
            страховщиком при оформлении.
          </p>

          {sortedQuotes.length === 0 ? (
            <p className="mt-6 text-ink-soft">Не удалось получить предложения, попробуйте другие параметры.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {sortedQuotes.map((q) => (
                <li
                  key={q.insurerId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4"
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium text-ink">
                      {q.insurerName}
                      {q.insurerId === cheapestId && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
                          Выгоднее всех
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-soft">{q.coverageSummary}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-serif text-lg font-bold text-ink">{currency.format(q.premium)}</span>
                    <button
                      onClick={() => chooseQuote(q)}
                      className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-ink"
                    >
                      Выбрать
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setStep("form")}
            className="mt-6 rounded-full border border-line px-5 py-2 text-sm text-ink-soft hover:border-accent"
          >
            Изменить параметры
          </button>
        </div>
      )}

      {step === "contact" && selectedQuote && (
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">Оставить заявку</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {selectedQuote.insurerName} — {currency.format(selectedQuote.premium)}. Мы свяжемся с вами,
            уточним детали и поможем оформить полис.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="name">
                Имя
              </label>
              <input
                id="name"
                value={contact.name}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="phone">
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                placeholder="+7 900 000-00-00"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="email">
                Email (необязательно)
              </label>
              <input
                id="email"
                type="email"
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink"
              />
            </div>
            {/* Honeypot — hidden from real visitors, bots tend to fill every field. */}
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              name="website"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              className="absolute h-0 w-0 opacity-0"
            />
            <label className="flex items-start gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Согласен(а) на обработку персональных данных в соответствии с{" "}
                <Link href="/privacy" className="text-accent-ink hover:underline">
                  политикой конфиденциальности
                </Link>
              </span>
            </label>
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep("quotes")}
              className="rounded-full border border-line px-5 py-2 text-sm text-ink-soft hover:border-accent"
            >
              Назад
            </button>
            <button
              onClick={submitApplication}
              disabled={loading}
              className="rounded-full bg-accent px-6 py-2 font-medium text-white hover:bg-accent-ink disabled:opacity-60"
            >
              {loading ? "Отправляем..." : "Отправить заявку"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-2xl">
            ✓
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-ink">Заявка отправлена</h1>
          <p className="mt-2 text-ink-soft">
            Номер заявки: <span className="font-mono">{applicationId}</span>. Мы свяжемся с вами в
            ближайшее рабочее время, чтобы уточнить детали и оформить полис у страховщика.
          </p>
          <Link href="/" className="mt-6 inline-block font-medium text-accent-ink hover:underline">
            На главную
          </Link>
        </div>
      )}
    </div>
  );
}
