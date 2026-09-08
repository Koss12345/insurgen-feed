import QuoteWizard from "@/components/QuoteWizard";

export const metadata = {
  title: "Подбор полиса — Алина Страховка",
};

export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const { type } = await searchParams;
  const initialType = Array.isArray(type) ? type[0] : type;

  return <QuoteWizard initialType={initialType} />;
}
