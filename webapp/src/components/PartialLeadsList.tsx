export interface PartialLeadRow {
  id: string;
  type: string;
  insurerName: string | null;
  premium: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  osago: "ОСАГО",
  kasko: "КАСКО",
  dms: "ДМС",
  travel: "Путешествия",
};

const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });

export default function PartialLeadsList({ leads }: { leads: PartialLeadRow[] }) {
  if (leads.length === 0) {
    return <p className="text-ink-soft">Незавершённых заявок нет.</p>;
  }

  return (
    <div>
      <p className="mb-3 text-sm text-ink-soft">
        Посетители, которые начали заполнять контакты на шаге заявки, но не отправили её. Стоит
        перезвонить самостоятельно.
      </p>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-4 py-3">Обновлено</th>
              <th className="px-4 py-3">Вид</th>
              <th className="px-4 py-3">Страховщик</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3">Контакт</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{dateFormat.format(new Date(lead.updatedAt))}</td>
                <td className="px-4 py-3">{TYPE_LABELS[lead.type] ?? lead.type}</td>
                <td className="px-4 py-3">{lead.insurerName ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{lead.premium ? currency.format(lead.premium) : "—"}</td>
                <td className="px-4 py-3">
                  <div className="text-ink">{lead.contactName ?? "—"}</div>
                  <div className="text-ink-soft">{lead.contactPhone ?? "—"}</div>
                  {lead.contactEmail && <div className="text-ink-soft">{lead.contactEmail}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
