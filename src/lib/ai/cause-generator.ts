import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export interface CauseContent {
  heroHeadline: string;
  heroSubheadline: string;
  bullets: string[];
  ctaText: string;
  aboutBody: string;
}

export async function generateCauseContent(
  title: string,
  description: string
): Promise<CauseContent> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a civic engagement copywriter. Given a cause title and description, generate compelling landing page content. Respond with ONLY valid JSON in this exact format:
{
  "heroHeadline": "A powerful, concise headline (max 10 words)",
  "heroSubheadline": "A supporting sentence that expands on the headline",
  "bullets": ["What we're asking for #1", "What we're asking for #2", "What we're asking for #3"],
  "ctaText": "Call-to-action button text (2-4 words)",
  "aboutBody": "A 2-3 paragraph HTML description of the cause, using <p>, <h3>, and <ul>/<li> tags"
}`,
      },
      {
        role: "user",
        content: `Cause title: ${title}\n\nDescription: ${description}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content generated");
  }

  return JSON.parse(content) as CauseContent;
}
