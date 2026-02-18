import { z } from "zod";
import crypto from "crypto";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const SUPPORT_RATE_LIMIT = 10; // per hour per IP
const RATE_WINDOW_MS = 60 * 60 * 1000;

export const supporterRouter = createTRPCRouter({
  support: publicProcedure
    .input(
      z.object({
        causeId: z.string(),
        email: z.string().email(),
        name: z.string().max(100).optional(),
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
});
