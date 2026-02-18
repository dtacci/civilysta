import { z } from "zod";
import { db } from "~/server/db";

export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be less than 50 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens"
  );

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.cause.findUnique({
    where: { slug },
    select: { id: true },
  });
  return !existing;
}

export async function generateUniqueSlug(
  title: string,
  maxAttempts = 10
): Promise<string> {
  let baseSlug = generateSlug(title);

  if (baseSlug.length < 3) {
    baseSlug = `cause-${Date.now().toString(36)}`;
  }

  if (await isSlugAvailable(baseSlug)) {
    return baseSlug;
  }

  for (let i = 1; i <= maxAttempts; i++) {
    const slugWithNumber = `${baseSlug}-${i}`;
    if (await isSlugAvailable(slugWithNumber)) {
      return slugWithNumber;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}
