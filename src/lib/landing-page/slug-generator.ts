import crypto from "crypto";
import { z } from "zod";
import { db } from "~/server/db";

export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(60, "Slug must be less than 60 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Only lowercase letters, numbers, and hyphens allowed"
  );

/** Words that add no meaning to a slug */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "shall", "should", "may", "might", "must", "can",
  "could", "this", "that", "these", "those", "my", "our", "your",
  "its", "his", "her", "their", "we", "us", "it",
]);

function randomSuffix(len = 3): string {
  return crypto.randomBytes(2).toString("base64url").slice(0, len).toLowerCase();
}

export function generateSlug(title: string): string {
  const words = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .split(/[\s_-]+/)
    .filter(Boolean);

  // Keep up to 4 meaningful words (skip stop words unless that leaves nothing)
  const meaningful = words.filter((w) => !STOP_WORDS.has(w));
  const chosen = (meaningful.length > 0 ? meaningful : words).slice(0, 4);

  const base = chosen.join("-");
  if (base.length < 2) return `cause-${randomSuffix(5)}`;

  return `${base}-${randomSuffix()}`;
}

export async function isSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const existing = await db.cause.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) return true;
  if (excludeId && existing.id === excludeId) return true;
  return false;
}

export async function generateUniqueSlug(title: string): Promise<string> {
  // Try up to 5 times — suffix collision is astronomically unlikely
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug(title);
    if (await isSlugAvailable(slug)) {
      return slug;
    }
  }
  // Nuclear fallback
  return `${generateSlug(title).split("-").slice(0, 4).join("-")}-${Date.now().toString(36)}`;
}
