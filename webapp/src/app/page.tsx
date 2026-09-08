import Link from "next/link";
import { INSURANCE_TYPES } from "@/lib/insurers/fields";

const STEPS = [
  { title: "Выберите вид страхования", text: "ОСАГО, КАСКО, ДМС или страховка для поездки" },
  { title: "Заполните короткую анкету", text: "2-4 поля — без паспортных данных на этом шаге" },
  { title: "Сравните предложения", text: "Несколько вариантов цены от партнёров-страховщиков" },
  { title: "Оставьте заявку", text: "Свяжемся и поможем оформить выбранный полис" },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-5 pt-16 pb-12 text-center">
        <h1 className="font-serif text-4xl font-bold text-ink sm:text-5xl">
          Страхование — простыми словами
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
          Сравните цены нескольких страховых компаний за пару минут и оформите полис без визита в
          офис.
        </p>
        <Link
          href="/quote"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-medium text-white hover:bg-accent-ink"
        >
          Подобрать полис
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {INSURANCE_TYPES.map((type) => (
            <Link
              key={type.id}
              href={`/quote?type=${type.id}`}
              className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:border-accent"
            >
              <span className="text-3xl" aria-hidden>
                {type.icon}
              </span>
              <span>
                <span className="block font-serif text-lg font-bold text-ink">{type.title}</span>
                <span className="mt-1 block text-sm text-ink-soft">{type.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center font-serif text-2xl font-bold text-ink">Как это работает</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-serif font-bold text-accent-ink">
                  {i + 1}
                </div>
                <h3 className="mt-3 font-medium text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="font-serif text-2xl font-bold text-ink">Разборы страхования в блоге</h2>
        <p className="mt-3 text-ink-soft">
          Что такое франшиза, чем ДМС отличается от ОМС, какую страховку взять в поездку — простым
          языком, без страхового жаргона.
        </p>
        <Link href="/blog" className="mt-5 inline-block font-medium text-accent-ink hover:underline">
          Читать блог →
        </Link>
      </section>
    </div>
  );
}
