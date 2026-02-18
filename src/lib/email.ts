import { Resend } from "resend";

const FROM_ADDRESS = "Civilysta <notifications@civilysta.com>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";
}

function unsubscribeFooter(token: string): string {
  const url = `${getSiteUrl()}/api/unsubscribe?token=${token}`;
  return `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="font-size:11px;color:#999;text-align:center">
      <a href="${url}" style="color:#999">Unsubscribe</a> from this cause&apos;s emails
    </p>
  `;
}

export async function sendSupporterNotification({
  toEmail,
  causeTitle,
  causeUrl,
  supporterName,
  supporterEmail,
}: {
  toEmail: string;
  causeTitle: string;
  causeUrl: string;
  supporterName?: string | null;
  supporterEmail: string;
}): Promise<void> {
  const resend = getResend();
  const displayName = supporterName || supporterEmail;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: `${displayName} just supported your cause`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
        <p><strong>${escapeHtml(displayName)}</strong> just signed up to support:</p>
        <h2 style="margin:16px 0">${escapeHtml(causeTitle)}</h2>
        <p><a href="${causeUrl}" style="color:#3b82f6">View your cause &rarr;</a></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#666">
          You're receiving this because you created a cause on
          <a href="https://civilysta.com" style="color:#3b82f6">Civilysta</a>.
        </p>
      </div>
    `,
  });
}

export async function sendEmailBlast({
  supporters,
  subject,
  message,
  causeTitle,
  causeUrl,
}: {
  supporters: { email: string; unsubscribeToken: string }[];
  subject: string;
  message: string;
  causeTitle: string;
  causeUrl: string;
}): Promise<{ sent: number; failed: number }> {
  const resend = getResend();
  let sent = 0;
  let failed = 0;

  // Resend batch API supports up to 100 emails per call
  const BATCH_SIZE = 100;
  for (let i = 0; i < supporters.length; i += BATCH_SIZE) {
    const chunk = supporters.slice(i, i + BATCH_SIZE);
    const emails = chunk.map((s) => ({
      from: FROM_ADDRESS,
      to: s.email,
      subject,
      headers: {
        "List-Unsubscribe": `<${getSiteUrl()}/api/unsubscribe?token=${s.unsubscribeToken}>`,
      },
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="margin:0 0 8px">${escapeHtml(causeTitle)}</h2>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
          <p style="margin-top:16px">
            <a href="${causeUrl}" style="color:#3b82f6">View cause &rarr;</a>
          </p>
          ${unsubscribeFooter(s.unsubscribeToken)}
        </div>
      `,
    }));

    try {
      await resend.batch.send(emails);
      sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed };
}
