import { z } from "zod";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import {
  generateUniqueSlug,
  slugSchema,
  isSlugAvailable,
} from "~/lib/landing-page/slug-generator";
import { generateCauseContent } from "~/lib/ai/cause-generator";
import { generateCauseImages } from "~/lib/ai/image-generator";
import { checkModeration } from "~/lib/moderation";
import { TRPCError } from "@trpc/server";
import { sendEmailBlast } from "~/lib/email";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

export const causeRouter = createTRPCRouter({
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { slug: input.slug },
        include: {
          images: true,
          creator: {
            select: { id: true, name: true, avatarUrl: true },
          },
          landingPage: true,
          _count: {
            select: { supporters: true, comments: true },
          },
        },
      });

      if (!cause || cause.status !== "PUBLISHED") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cause not found" });
      }

      return cause;
    }),

  generatePreview: publicProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting — 5 requests per hour per IP
      const ip = getClientIp(ctx.headers);
      const ipHash = hashIp(ip);
      const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

      const recentRequests = await ctx.db.generationRequest.count({
        where: { ipHash, type: "generation", createdAt: { gte: oneHourAgo } },
      });

      if (recentRequests >= RATE_LIMIT_MAX) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "You've reached the generation limit. Please try again in an hour.",
        });
      }

      // Log this request + clean up old records across all types
      await Promise.all([
        ctx.db.generationRequest.create({ data: { ipHash, type: "generation" } }),
        ctx.db.generationRequest.deleteMany({
          where: { createdAt: { lt: oneHourAgo } },
        }),
      ]);

      // Content moderation on user input
      await checkModeration(input.title + " " + input.description);

      const [content, images] = await Promise.all([
        generateCauseContent(input.title, input.description),
        generateCauseImages(input.title, input.description),
      ]);

      return { content, images };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10).max(2000),
        goal: z.string().max(500).optional(),
        selectedImageUrl: z
          .string()
          .refine(
            (url) =>
              url.startsWith("data:image/") ||
              url.startsWith("https://") ,
            { message: "Image must be a data URI or HTTPS URL" }
          )
          .optional(),
        heroHeadline: z.string().max(200).optional(),
        heroSubheadline: z.string().max(500).optional(),
        heroBullets: z.array(z.string().max(200)).max(10).optional(),
        ctaText: z.string().max(50).optional(),
        primaryColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Content moderation on user input
      await checkModeration(input.title + " " + input.description);

      const slug = await generateUniqueSlug(input.title);

      // Feature-flagged review queue
      const requireReview = process.env.REQUIRE_REVIEW === "true";
      const causeStatus = requireReview ? "PENDING_REVIEW" : "PUBLISHED";
      const landingStatus = requireReview ? "PENDING_REVIEW" : "PUBLISHED";
      const publishedAt = requireReview ? null : new Date();

      const cause = await ctx.db.cause.create({
        data: {
          slug,
          title: input.title,
          description: input.description,
          goal: input.goal,
          imageUrl: input.selectedImageUrl,
          status: causeStatus,
          creatorId: ctx.user.id,
          landingPage: {
            create: {
              status: landingStatus,
              publishedAt,
              config: {
                title: input.title,
                description: input.description,
                primaryColor: input.primaryColor ?? "#3b82f6",
                secondaryColor: "#60a5fa",
                heroHeadline: input.heroHeadline ?? input.title,
                heroSubheadline: input.heroSubheadline ?? input.description,
                heroBullets: input.heroBullets ?? [],
                ctaText: input.ctaText ?? "Support This Cause",
                heroImage: input.selectedImageUrl,
              },
            },
          },
        },
      });

      // Save AI-generated images if any
      if (input.selectedImageUrl) {
        await ctx.db.causeImage.create({
          data: {
            causeId: cause.id,
            url: input.selectedImageUrl,
            isAiGenerated: true,
            isSelected: true,
          },
        });
      }

      return { slug: cause.slug, id: cause.id, status: causeStatus };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.id, creatorId: ctx.user.id },
        include: {
          _count: { select: { supporters: true, comments: true } },
          images: true,
          landingPage: true,
        },
      });

      if (!cause) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cause not found" });
      }

      return cause;
    }),

  listMine: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const causes = await ctx.db.cause.findMany({
        where: { creatorId: ctx.user.id },
        take: limit + 1,
        ...(input?.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
        include: {
          _count: { select: { supporters: true, comments: true } },
          images: { where: { isSelected: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (causes.length > limit) {
        const nextItem = causes.pop();
        nextCursor = nextItem?.id;
      }

      return { causes, nextCursor };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).max(2000).optional(),
        goal: z.string().max(500).optional(),
        slug: slugSchema.optional(),
        status: z
          .enum(["DRAFT", "PUBLISHED", "PENDING_REVIEW", "ARCHIVED"])
          .optional(),
        updateMessage: z.string().max(500).optional().nullable(),
        webhookUrl: z
          .string()
          .url()
          .max(500)
          .refine((url) => url.startsWith("https://"), {
            message: "Webhook URL must use HTTPS",
          })
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.id },
      });

      if (!cause || cause.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Validate slug uniqueness if changing + create redirect from old slug
      if (input.slug && input.slug !== cause.slug) {
        const available = await isSlugAvailable(input.slug, input.id);
        if (!available) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This URL is already taken. Try another.",
          });
        }
        // Redirect old slug to new slug so existing links don't break
        await ctx.db.slugRedirect.upsert({
          where: { oldSlug: cause.slug },
          update: { newSlug: input.slug },
          create: { oldSlug: cause.slug, newSlug: input.slug, causeId: cause.id },
        });
        // Also revalidate the old slug path
        revalidatePath(`/p/${cause.slug}`);
      }

      // Auto-blast supporters when updateMessage changes
      if (
        input.updateMessage &&
        input.updateMessage !== cause.updateMessage &&
        process.env.RESEND_API_KEY
      ) {
        const siteUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";
        const causeUrl = `${siteUrl}/p/${cause.slug}`;
        const supporters = await ctx.db.supporter.findMany({
          where: { causeId: input.id, unsubscribed: false },
          select: { email: true, unsubscribeToken: true },
        });
        if (supporters.length > 0) {
          void sendEmailBlast({
            supporters,
            subject: `Update: ${cause.title}`,
            message: input.updateMessage,
            causeTitle: cause.title,
            causeUrl,
          }).catch((err) =>
            console.error("Auto-update email blast failed:", err),
          );
        }
      }

      const { id, ...data } = input;
      const updated = await ctx.db.cause.update({ where: { id }, data });

      // Bust ISR cache for the public cause page
      revalidatePath(`/p/${updated.slug}`);

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.id },
      });

      if (!cause || cause.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.cause.delete({ where: { id: input.id } });
      return { success: true };
    }),

  updateLandingPage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        heroHeadline: z.string().min(1).max(200).optional(),
        heroSubheadline: z.string().max(500).optional(),
        heroImage: z
          .string()
          .refine(
            (url) =>
              url.startsWith("data:image/") || url.startsWith("https://"),
            { message: "Image must be a data URI or HTTPS URL" },
          )
          .optional()
          .nullable(),
        heroBullets: z.array(z.string().max(200)).max(10).optional(),
        ctaText: z.string().max(50).optional(),
        primaryColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        location: z.string().max(300).optional().nullable(),
        event: z
          .object({
            title: z.string().max(200).optional(),
            date: z.string(),
            time: z.string().optional(),
            recurrence: z.enum(["none", "weekly", "biweekly", "monthly"]),
            endDate: z.string().optional(),
          })
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.id },
      });

      if (!cause || cause.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const landingPage = await ctx.db.landingPage.findUnique({
        where: { causeId: input.id },
      });

      const current = (landingPage?.config ?? {}) as Record<string, unknown>;
      const { id: _id, ...fields } = input;
      const updated = {
        ...current,
        ...Object.fromEntries(
          Object.entries(fields).filter(([, v]) => v !== undefined),
        ),
      } as Record<string, string | string[] | null>;

      await ctx.db.landingPage.update({
        where: { causeId: input.id },
        data: { config: updated },
      });

      // Mirror imageUrl to Cause table if hero image changed
      if ("heroImage" in fields) {
        await ctx.db.cause.update({
          where: { id: input.id },
          data: { imageUrl: input.heroImage ?? null },
        });
      }

      // Bust ISR cache for the public cause page
      revalidatePath(`/p/${cause.slug}`);

      return { success: true };
    }),
});
