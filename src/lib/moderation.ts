import sanitizeHtml from "sanitize-html";
import OpenAI from "openai";
import { TRPCError } from "@trpc/server";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Check text against OpenAI's Moderation API.
 * Throws a TRPCError if the content is flagged.
 * Fails open (logs warning) if the API is unreachable.
 */
export async function checkModeration(text: string): Promise<void> {
  try {
    const openai = getOpenAI();
    const result = await openai.moderations.create({ input: text });
    if (result.results[0]?.flagged) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "This content may violate our community guidelines. Please revise and try again.",
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    console.warn("Moderation API unavailable, skipping check:", err);
  }
}

/**
 * Strip dangerous HTML from AI-generated content.
 * Only allows safe structural tags — no scripts, styles, event handlers, or links.
 */
export function sanitizeAboutBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "h3", "ul", "ol", "li", "strong", "em", "br"],
    allowedAttributes: {},
  });
}
