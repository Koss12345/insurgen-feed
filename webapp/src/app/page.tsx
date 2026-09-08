import Link from "next/link";
import { INSURANCE_TYPES } from "@/lib/insurers/fields";
import { REVIEWS } from "@/lib/reviews";
import { prisma } from "@/lib/db";
import Faq from "@/components/Faq";

// Reads live data (applications count) on every request — must not be
// statically prerendered, or the counter would freeze at its build-time value.
export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Выберите вид страхования", text: "ОСАГО, КАСКО, ДМС или страховка для поездки" },
  { title: "Заполните короткую анкету", text: "2-4 поля — без паспортных данных на этом шаге" },
  { title: "Сравните предложения", text: "Несколько вариантов цены от партнёров-страховщиков" },
  { title: "Оставьте заявку", text: "Свяжемся и поможем оформить выбранный полис" },
];

const FAQ_ITEMS = [
  {
    question: "Вы страховая компания?",
    answer:
      "Нет, мы не страховщик. Мы помогаем сравнить условия и подобрать полис, а оформляете его у лицензированной страховой компании-партнёра.",
  },
  {
    question: "Подбор полиса и заявка — это бесплатно?",
    answer: "Да, расчёт цены и заявка ничего не стоят. Вы платите только за сам страховой полис при оформлении.",
  },
  {
    question: "Насколько точна цена в калькуляторе?",
    answer:
      "Это ориентировочная стоимость на основе введённых вами данных. Итоговую цену подтверждает страховая компания при оформлении полиса.",
  },
  {
    question: "Как быстро со мной свяжутся после заявки?",
    answer: "Обычно в течение рабочего дня — уточним детали по телефону и поможем довести оформление до конца.",
  },
  {
    question: "Что происходит с моими персональными данными?",
    answer:
      "Используем их только чтобы связаться с вами и оформить полис. Подробности — в политике обработки персональных данных.",
  },
  {
    question: "Можно ли передумать после заявки?",
    answer: "Да, до момента оформления полиса вы ничем не обязаны — просто сообщите об этом при звонке.",
  },
];

export default async function Home() {
  const issuedCount = await prisma.application.count({ where: { status: "issued" } });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
        {issuedCount > 0 && (
          <p className="mt-4 text-sm text-ink-soft">Уже помогли оформить {issuedCount} полисов</p>
        )}
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

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center font-serif text-2xl font-bold text-ink">Что говорят клиенты</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {REVIEWS.map((review) => (
            <div key={review.name} className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-ink-soft">«{review.text}»</p>
              <p className="mt-3 text-sm font-medium text-ink">
                {review.name} · {review.type}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink">Как мы работаем с партнёрами</h2>
          <p className="mt-3 text-ink-soft">
            Мы сравниваем условия у нескольких лицензированных страховых компаний и подключаем к
            подбору новых партнёров по мере роста. Оформление всегда происходит напрямую у
            страховщика — мы не берём деньги за полис на этом сайте.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-16">
        <h2 className="text-center font-serif text-2xl font-bold text-ink">Частые вопросы</h2>
        <div className="mt-8">
          <Faq items={FAQ_ITEMS} />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16 text-center">
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
