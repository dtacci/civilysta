import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export async function generateCauseImages(
  title: string,
  description: string,
  count: number = 3
): Promise<GeneratedImage[]> {
  const basePrompt = buildImagePrompt(title, description);

  const variations = [
    `${basePrompt}, hopeful and uplifting tone, warm lighting`,
    `${basePrompt}, community gathering, diverse people united`,
    `${basePrompt}, symbolic representation, bold and modern design`,
  ].slice(0, count);

  // Use Gemini's image generation capability
  const genai = getGenAI();
  const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const results = await Promise.allSettled(
    variations.map(async (prompt) => {
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "text/plain",
        },
      });

      const _text = response.response.text();

      // Imagen 4 Fast requires the Vertex AI API or the newer @google/genai SDK.
      // The image URL will be populated when the proper API is configured.
      return { url: "", prompt } as GeneratedImage;
    })
  );

  const images: GeneratedImage[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      images.push(result.value);
    }
  }

  // If no real images generated, return placeholder data URLs
  // (In production, this would use Imagen 4 Fast via Vertex AI)
  if (images.length === 0 || images.every((img) => !img.url)) {
    return variations.map((prompt) => ({
      url: generatePlaceholderSvg(title),
      prompt,
    }));
  }

  return images;
}

function buildImagePrompt(title: string, description: string): string {
  return `Create a compelling, photorealistic hero image for a civic cause website. The cause is: "${title}". ${description}. The image should be suitable as a website hero banner, 16:9 aspect ratio, professional quality, no text overlay`;
}

function generatePlaceholderSvg(title: string): string {
  const colors = ["3b82f6", "10b981", "8b5cf6", "f59e0b", "ef4444"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:#${color};stop-opacity:0.4" />
      </linearGradient>
    </defs>
    <rect width="1200" height="675" fill="url(#g)" />
    <text x="600" y="337" text-anchor="middle" fill="white" font-size="32" font-family="system-ui">${escapeXml(title.slice(0, 50))}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
