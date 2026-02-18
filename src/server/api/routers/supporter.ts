import { z } from "zod";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { sendSupporterNotification, sendEmailBlast } from "~/lib/email";
import { fireWebhook } from "~/lib/webhook";

const SUPPORT_RATE_LIMIT = 10; // per hour per IP
const RATE_WINDOW_MS = 60 * 60 * 1000;

export const supporterRouter = createTRPCRouter({
  support: publicProcedure
    .input(
      z.object({
        causeId: z.string(),
        email: z.string().email(),
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting by IP
      const ip =
        ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        ctx.headers.get("x-real-ip") ??
        "unknown";
      const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
      const oneHourAgo = new Date(Date.now() - RATE_WINDOW_MS);

      const recentRequests = await ctx.db.generationRequest.count({
        where: { ipHash, createdAt: { gte: oneHourAgo } },
      });

      if (recentRequests >= SUPPORT_RATE_LIMIT) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
        });
      }

      await ctx.db.generationRequest.create({ data: { ipHash } });

      // Check if already a supporter
      const existing = await ctx.db.supporter.findUnique({
        where: {
          causeId_email: {
            causeId: input.causeId,
            email: input.email,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already supported this cause",
        });
      }

      // Create supporter and increment count
      const [supporter] = await ctx.db.$transaction([
        ctx.db.supporter.create({
          data: {
            causeId: input.causeId,
            email: input.email,
            name: input.name,
          },
        }),
        ctx.db.cause.update({
          where: { id: input.causeId },
          data: { supporterCount: { increment: 1 } },
        }),
      ]);

      // Fire-and-forget: email notification + webhook
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.causeId },
        include: { creator: { select: { email: true } } },
      });

      if (cause) {
        const siteUrl =
          process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";
        const causeUrl = `${siteUrl}/p/${cause.slug}`;

        if (cause.creator?.email && process.env.RESEND_API_KEY) {
          void sendSupporterNotification({
            toEmail: cause.creator.email,
            causeTitle: cause.title,
            causeUrl,
            supporterName: input.name,
            supporterEmail: input.email,
          }).catch((err) =>
            console.error("Notification email failed:", err),
          );
        }

        if (cause.webhookUrl) {
          void fireWebhook(cause.webhookUrl, {
            event: "new_supporter",
            causeId: input.causeId,
            causeTitle: cause.title,
            causeUrl,
            supporter: {
              name: input.name ?? null,
              email: input.email,
              createdAt: new Date().toISOString(),
            },
          }).catch((err) =>
            console.error("Webhook delivery failed:", err),
          );
        }

        // Bust ISR cache so supporter count updates on the page + OG image
        revalidatePath(`/p/${cause.slug}`);
      }

      return { id: supporter.id };
    }),

  getCount: publicProcedure
    .input(z.object({ causeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.causeId },
        select: { supporterCount: true },
      });
      return { count: cause?.supporterCount ?? 0 };
    }),

  getRecentNames: publicProcedure
    .input(z.object({ causeId: z.string(), limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      const supporters = await ctx.db.supporter.findMany({
        where: { causeId: input.causeId, name: { not: null } },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: { name: true, createdAt: true },
      });

      // Return first name + last initial only (privacy)
      const names = supporters.map((s) => {
        const parts = (s.name ?? "").trim().split(/\s+/);
        if (parts.length >= 2) {
          return `${parts[0]} ${parts[parts.length - 1]![0]!.toUpperCase()}.`;
        }
        return parts[0] ?? "Supporter";
      });

      return { names };
    }),

  listByCause: protectedProcedure
    .input(z.object({ causeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.causeId },
      });

      if (!cause || cause.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const supporters = await ctx.db.supporter.findMany({
        where: { causeId: input.causeId },
        orderBy: { createdAt: "desc" },
        select: { email: true, name: true, createdAt: true },
      });

      return { supporters };
    }),

  sendBlast: protectedProcedure
    .input(
      z.object({
        causeId: z.string(),
        subject: z.string().min(1).max(200),
        message: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.causeId },
      });

      if (!cause || cause.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const supporters = await ctx.db.supporter.findMany({
        where: { causeId: input.causeId, unsubscribed: false },
        select: { email: true, unsubscribeToken: true },
      });

      if (supporters.length === 0) {
        return { sent: 0, failed: 0 };
      }

      const siteUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";
      const causeUrl = `${siteUrl}/p/${cause.slug}`;

      const result = await sendEmailBlast({
        supporters,
        subject: input.subject,
        message: input.message,
        causeTitle: cause.title,
        causeUrl,
      });

      return result;
    }),
});
