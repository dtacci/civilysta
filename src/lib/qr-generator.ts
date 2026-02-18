import QRCode from "qrcode";

export async function generateUrlQR(
  url: string,
  options: {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  } = {}
): Promise<string> {
  return QRCode.toDataURL(url, {
    width: options.width ?? 300,
    margin: options.margin ?? 4,
    color: {
      dark: options.color?.dark ?? "#000000",
      light: options.color?.light ?? "#FFFFFF",
    },
    errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
  });
}

export function createCauseShareUrl(
  slug: string,
  source = "qr",
  baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
): string {
  const url = new URL(`/p/${slug}`, baseUrl);
  url.searchParams.set("ref", source);
  return url.toString();
}

export async function generateCauseQR(
  slug: string,
  options: {
    width?: number;
    color?: { dark?: string; light?: string };
  } = {}
): Promise<string> {
  const shareUrl = createCauseShareUrl(slug, "qr");
  return generateUrlQR(shareUrl, options);
}
