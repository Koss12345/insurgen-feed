"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ApplicationRow {
  id: string;
  type: string;
  insurerName: string;
  premium: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
  issued: "Оформлен",
  cancelled: "Отменена",
};

const TYPE_LABELS: Record<string, string> = {
  osago: "ОСАГО",
  kasko: "КАСКО",
  dms: "ДМС",
  travel: "Путешествия",
};

const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });

export default function ApplicationsTable({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(applications);
  const [pending, setPending] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setPending(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } finally {
      setPending(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink">Заявки</h1>
        <button onClick={logout} className="text-sm text-ink-soft hover:text-accent-ink">
          Выйти
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-ink-soft">Заявок пока нет.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Вид</th>
                <th className="px-4 py-3">Страховщик</th>
                <th className="px-4 py-3">Цена</th>
                <th className="px-4 py-3">Контакт</th>
                <th className="px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{dateFormat.format(new Date(row.createdAt))}</td>
                  <td className="px-4 py-3">{TYPE_LABELS[row.type] ?? row.type}</td>
                  <td className="px-4 py-3">{row.insurerName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{currency.format(row.premium)}</td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{row.contactName}</div>
                    <div className="text-ink-soft">{row.contactPhone}</div>
                    {row.contactEmail && <div className="text-ink-soft">{row.contactEmail}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      disabled={pending === row.id}
                      onChange={(e) => updateStatus(row.id, e.target.value)}
                      className="rounded-lg border border-line bg-surface px-2 py-1 text-ink"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
