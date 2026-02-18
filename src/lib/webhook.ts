import { lookup } from "dns/promises";

/**
 * Validate that a URL is safe for outbound requests (no SSRF).
 * Requires HTTPS and a publicly routable IP address.
 */
async function validateWebhookUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS");
  }

  // Resolve hostname to check for internal IPs
  const hostname = parsed.hostname;

  // Block obvious internal hostnames
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Webhook URL must not point to internal hosts");
  }

  try {
    const { address } = await lookup(hostname);
    if (isPrivateIp(address)) {
      throw new Error("Webhook URL must not resolve to a private IP address");
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private IP")) throw err;
    throw new Error(`Could not resolve webhook hostname: ${hostname}`);
  }
}

function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return true; // IPv6 or malformed — block by default

  const [a, b] = parts;
  return (
    a === 10 ||                           // 10.0.0.0/8
    (a === 172 && b! >= 16 && b! <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) ||            // 192.168.0.0/16
    a === 127 ||                           // 127.0.0.0/8 (loopback)
    (a === 169 && b === 254) ||            // 169.254.0.0/16 (link-local)
    a === 0                                // 0.0.0.0/8
  );
}

export async function fireWebhook(
  url: string,
  payload: object,
): Promise<void> {
  await validateWebhookUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
