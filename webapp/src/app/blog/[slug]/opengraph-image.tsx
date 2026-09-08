import { ImageResponse } from "next/og";
import { ARTICLES, getArticle } from "@/lib/articles";

export const alt = "Статья — Алина Страховка";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  const title = article?.title ?? "Алина Страховка";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#eef2f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 24, color: "#3e8fd0", fontWeight: 600, display: "flex" }}>Алина Страховка</div>
        <div style={{ fontSize: 56, fontWeight: 700, color: "#17223b", marginTop: 24, display: "flex", lineHeight: 1.2 }}>
          {title}
        </div>
      </div>
    ),
    { ...size },
  );
}
