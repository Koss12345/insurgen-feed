import type { Metadata } from "next";
import { Golos_Text, PT_Serif } from "next/font/google";
import Link from "next/link";
import Analytics from "@/components/Analytics";
import CallbackWidget from "@/components/CallbackWidget";
import "./globals.css";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "Алина Страховка — подбор и оформление полиса онлайн";
const description =
  "Сравните предложения по ОСАГО, КАСКО, ДМС и страхованию путешественников и оформите полис online.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s — Алина Страховка" },
  description,
  openGraph: { title, description, siteName: "Алина Страховка", locale: "ru_RU", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "InsuranceAgency",
  name: "Алина Страховка",
  description,
  url: siteUrl,
};

const NAV_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/quote", label: "Подобрать полис" },
  { href: "/blog", label: "Блог" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${golos.variable} ${ptSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-serif text-lg font-bold text-ink">
              Алина Страховка
            </Link>
            <nav className="flex gap-5 text-sm text-ink-soft">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-accent-ink">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line bg-surface">
          <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-ink-soft">
            <p className="mb-2">
              Алина Страховка — страхование простыми словами. Не является страховщиком; помогаем
              подобрать и оформить полис у партнёров.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="hover:text-accent-ink">
                Политика обработки персональных данных
              </Link>
              <Link href="/admin" className="hover:text-accent-ink">
                Для сотрудников
              </Link>
            </div>
          </div>
        </footer>

        <CallbackWidget />
        <Analytics />
      </body>
    </html>
  );
}
