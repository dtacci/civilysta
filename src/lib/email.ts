import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
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
    from: "Civilysta <notifications@civilysta.com>",
    to: toEmail,
    subject: `${displayName} just supported your cause`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
        <p><strong>${displayName}</strong> just signed up to support:</p>
        <h2 style="margin:16px 0">${causeTitle}</h2>
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
