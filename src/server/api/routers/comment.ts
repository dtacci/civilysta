import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const commentRouter = createTRPCRouter({
  getByCause: publicProcedure
    .input(
      z.object({
        causeId: z.string(),
        sortBy: z.enum(["newest", "oldest", "top"]).default("top"),
      })
    )
    .query(async ({ ctx, input }) => {
      const orderBy =
        input.sortBy === "newest"
          ? { createdAt: "desc" as const }
          : input.sortBy === "oldest"
            ? { createdAt: "asc" as const }
            : { score: "desc" as const };

      const comments = await ctx.db.comment.findMany({
        where: { causeId: input.causeId, parentId: null },
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, name: true, avatarUrl: true },
              },
              votes: ctx.user
                ? { where: { userId: ctx.user.id } }
                : false,
            },
            orderBy: { score: "desc" },
          },
          votes: ctx.user
            ? { where: { userId: ctx.user.id } }
            : false,
        },
        orderBy,
      });

      return comments;
    }),

  create: protectedProcedure
    .input(
      z.object({
        causeId: z.string(),
        content: z.string().min(1).max(5000),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let depth = 0;
      if (input.parentId) {
        const parent = await ctx.db.comment.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found",
          });
        }
        depth = parent.depth + 1;
        if (depth > 3) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Maximum nesting depth reached",
          });
        }
      }

      return ctx.db.comment.create({
        data: {
          content: input.content,
          causeId: input.causeId,
          authorId: ctx.user.id,
          parentId: input.parentId,
          depth,
        },
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
    }),

  vote: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        voteType: z.enum(["UP", "DOWN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingVote = await ctx.db.commentVote.findUnique({
        where: {
          commentId_userId: {
            commentId: input.commentId,
            userId: ctx.user.id,
          },
        },
      });

      if (existingVote) {
        if (existingVote.voteType === input.voteType) {
          // Remove vote
          await ctx.db.commentVote.delete({
            where: { id: existingVote.id },
          });
          await ctx.db.comment.update({
            where: { id: input.commentId },
            data: {
              upvoteCount:
                input.voteType === "UP" ? { decrement: 1 } : undefined,
              downvoteCount:
                input.voteType === "DOWN" ? { decrement: 1 } : undefined,
              score:
                input.voteType === "UP"
                  ? { decrement: 1 }
                  : { increment: 1 },
            },
          });
          return { action: "removed" as const };
        } else {
          // Change vote
          await ctx.db.commentVote.update({
            where: { id: existingVote.id },
            data: { voteType: input.voteType },
          });
          await ctx.db.comment.update({
            where: { id: input.commentId },
            data: {
              upvoteCount:
                input.voteType === "UP"
                  ? { increment: 1 }
                  : { decrement: 1 },
              downvoteCount:
                input.voteType === "DOWN"
                  ? { increment: 1 }
                  : { decrement: 1 },
              score:
                input.voteType === "UP"
                  ? { increment: 2 }
                  : { decrement: 2 },
            },
          });
          return { action: "changed" as const };
        }
      }

      // New vote
      await ctx.db.commentVote.create({
        data: {
          commentId: input.commentId,
          userId: ctx.user.id,
          voteType: input.voteType,
        },
      });
      await ctx.db.comment.update({
        where: { id: input.commentId },
        data: {
          upvoteCount:
            input.voteType === "UP" ? { increment: 1 } : undefined,
          downvoteCount:
            input.voteType === "DOWN" ? { increment: 1 } : undefined,
          score:
            input.voteType === "UP" ? { increment: 1 } : { decrement: 1 },
        },
      });
      return { action: "created" as const };
    }),
});
