"use client";

import { useState } from "react";

export interface CallbackRow {
  id: string;
  name: string;
  phone: string;
  comment: string | null;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
  cancelled: "Отменена",
};

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });

export default function CallbackRequestsTable({ requests }: { requests: CallbackRow[] }) {
  const [rows, setRows] = useState(requests);
  const [pending, setPending] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setPending(id);
    try {
      const res = await fetch(`/api/callback/${id}`, {
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

  if (rows.length === 0) {
    return <p className="text-ink-soft">Заявок на звонок пока нет.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-line text-ink-soft">
          <tr>
            <th className="px-4 py-3">Дата</th>
            <th className="px-4 py-3">Имя</th>
            <th className="px-4 py-3">Телефон</th>
            <th className="px-4 py-3">Комментарий</th>
            <th className="px-4 py-3">Статус</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{dateFormat.format(new Date(row.createdAt))}</td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3 whitespace-nowrap">{row.phone}</td>
              <td className="px-4 py-3 text-ink-soft">{row.comment ?? "—"}</td>
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
  );
}
