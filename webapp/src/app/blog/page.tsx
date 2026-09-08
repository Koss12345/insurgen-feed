import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

export const metadata = {
  title: "Блог",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl font-bold text-ink">Блог</h1>
      <p className="mt-2 text-ink-soft">Разборы страхования простыми словами</p>

      <ul className="mt-8 space-y-6">
        {ARTICLES.map((article) => (
          <li key={article.slug} className="rounded-xl border border-line bg-surface p-5">
            <Link href={`/blog/${article.slug}`} className="font-serif text-xl font-bold text-ink hover:text-accent-ink">
              {article.title}
            </Link>
            <p className="mt-2 text-ink-soft">{article.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
