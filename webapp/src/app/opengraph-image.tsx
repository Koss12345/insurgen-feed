import { ImageResponse } from "next/og";

export const alt = "Алина Страховка — подбор и оформление полиса онлайн";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#eef2f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: "#17223b", display: "flex" }}>Алина Страховка</div>
        <div style={{ fontSize: 32, color: "#4b5670", marginTop: 24, display: "flex" }}>
          Страхование — простыми словами
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "14px 32px",
            borderRadius: 999,
            background: "#3e8fd0",
            color: "white",
            fontSize: 28,
            display: "flex",
          }}
        >
          Подобрать полис онлайн
        </div>
      </div>
    ),
    { ...size },
  );
}
