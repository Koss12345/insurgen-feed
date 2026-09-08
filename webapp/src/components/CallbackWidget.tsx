"use client";

import { useState } from "react";

export default function CallbackWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 5) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), website }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-line bg-surface p-4 shadow-lg">
          {status === "done" ? (
            <div className="text-center">
              <p className="font-medium text-ink">Спасибо! Перезвоним в ближайшее время.</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-3 text-sm text-accent-ink hover:underline"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <p className="font-medium text-ink">Заказать звонок</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="Телефон"
                className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                name="website"
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute h-0 w-0 opacity-0"
              />
              {status === "error" && (
                <p className="mt-2 text-xs text-danger">Проверьте имя и телефон, попробуйте ещё раз</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-3 w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-60"
              >
                {status === "loading" ? "Отправляем..." : "Перезвоните мне"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Заказать звонок"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-lg hover:bg-accent-ink"
      >
        {open ? "✕" : "📞"}
      </button>
    </div>
  );
}
