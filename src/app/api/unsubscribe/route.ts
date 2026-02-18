import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  try {
    await db.supporter.update({
      where: { unsubscribeToken: token },
      data: { unsubscribed: true, unsubscribedAt: new Date() },
    });
  } catch {
    return new NextResponse(
      html("Link expired or invalid", "This unsubscribe link is no longer valid."),
      { status: 404, headers: { "Content-Type": "text/html" } },
    );
  }

  return new NextResponse(
    html("Unsubscribed", "You have been unsubscribed and will no longer receive emails for this cause."),
    { headers: { "Content-Type": "text/html" } },
  );
}

function html(title: string, message: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fafafa">
<div style="text-align:center;max-width:400px;padding:24px">
<h1 style="font-size:24px;margin:0 0 8px">${title}</h1>
<p style="color:#666;margin:0">${message}</p>
</div></body></html>`;
}
