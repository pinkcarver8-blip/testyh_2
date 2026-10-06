import { ImageResponse } from "next/og";

export const alt = "My Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
        color: "#fafafa",
      }}
    >
      <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -2 }}>
        My Blog
      </div>
      <div style={{ marginTop: 24, fontSize: 36, color: "#a1a1aa" }}>
        Boards &amp; posts, all in one place
      </div>
    </div>,
    size,
  );
}
