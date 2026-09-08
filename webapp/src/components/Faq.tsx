export interface FaqItem {
  question: string;
  answer: string;
}

export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.question} className="group rounded-xl border border-line bg-surface p-4">
          <summary className="cursor-pointer list-none font-medium text-ink marker:content-none">
            <span className="flex items-center justify-between gap-4">
              {item.question}
              <span className="text-ink-soft transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 text-sm text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
