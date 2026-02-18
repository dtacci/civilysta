import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

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
});
