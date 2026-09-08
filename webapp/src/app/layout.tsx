import type { Metadata } from "next";
import { Golos_Text, PT_Serif } from "next/font/google";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "Алина Страховка — подбор и оформление полиса онлайн",
  description:
    "Сравните предложения по ОСАГО, КАСКО, ДМС и страхованию путешественников и оформите полис online.",
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
      </body>
    </html>
  );
}
