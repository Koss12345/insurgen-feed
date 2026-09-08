"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ApplicationsTable, { type ApplicationRow } from "./ApplicationsTable";
import CallbackRequestsTable, { type CallbackRow } from "./CallbackRequestsTable";
import PartialLeadsList, { type PartialLeadRow } from "./PartialLeadsList";

type Tab = "applications" | "partial" | "callbacks";

export default function AdminDashboard({
  applications,
  partialLeads,
  callbacks,
}: {
  applications: ApplicationRow[];
  partialLeads: PartialLeadRow[];
  callbacks: CallbackRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("applications");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "applications", label: "Заявки", count: applications.length },
    { id: "partial", label: "Незавершённые", count: partialLeads.length },
    { id: "callbacks", label: "Обратные звонки", count: callbacks.length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink">Заявки</h1>
        <button onClick={logout} className="text-sm text-ink-soft hover:text-accent-ink">
          Выйти
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id ? "border-accent text-accent-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "applications" && <ApplicationsTable applications={applications} />}
        {tab === "partial" && <PartialLeadsList leads={partialLeads} />}
        {tab === "callbacks" && <CallbackRequestsTable requests={callbacks} />}
      </div>
    </div>
  );
}
