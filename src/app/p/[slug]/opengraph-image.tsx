import { ImageResponse } from "next/og";
import { db } from "~/server/db";

export const runtime = "nodejs";
export const revalidate = 300; // ISR: same cadence as the cause page
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cause = await db.cause.findUnique({
    where: { slug },
    select: { title: true, supporterCount: true, imageUrl: true },
  });

  if (!cause) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#0f172a",
            color: "#fff",
            fontSize: 48,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Not found
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 72,
          background: cause.imageUrl
            ? `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)), url(${cause.imageUrl})`
            : "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "#ef4444",
              color: "#fff",
              padding: "6px 16px",
              borderRadius: 6,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            CIVILYSTA
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            color: "#fff",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1,
            maxWidth: 900,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {cause.title}
        </div>

        {/* Footer: supporter count + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ color: "#e2e8f0", fontSize: 32, fontWeight: 600 }}>
            {"\u2665"} {cause.supporterCount.toLocaleString()} supporter
            {cause.supporterCount !== 1 ? "s" : ""}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 24 }}>civilysta.com</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
