import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle } from "@/lib/articles";
import { getInsuranceTypeConfig } from "@/lib/insurers/fields";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article ? `${article.title} — Алина Страховка` : "Статья не найдена" };
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const typeConfig = getInsuranceTypeConfig(article.relatedType);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/blog" className="text-sm text-ink-soft hover:text-accent-ink">
        ← Блог
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-bold text-ink">{article.title}</h1>

      <div className="mt-6 space-y-4 text-ink">
        {article.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {typeConfig && (
        <div className="mt-10 rounded-xl border border-line bg-surface p-5">
          <p className="text-ink-soft">Хотите узнать цену {typeConfig.title.toLowerCase()} для себя?</p>
          <Link
            href={`/quote?type=${article.relatedType}`}
            className="mt-3 inline-block rounded-full bg-accent px-5 py-2 font-medium text-white hover:bg-accent-ink"
          >
            Подобрать полис
          </Link>
        </div>
      )}
    </div>
  );
}
