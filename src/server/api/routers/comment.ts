import { z } from "zod";
import crypto from "crypto";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const COMMENT_RATE_LIMIT = 10; // per hour per IP
const RATE_WINDOW_MS = 60 * 60 * 1000;

export const commentRouter = createTRPCRouter({
  getByCause: publicProcedure
    .input(
      z.object({
        causeId: z.string(),
        sortBy: z.enum(["newest", "oldest", "top"]).default("top"),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
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
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
          replies: {
            take: 10,
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

      let nextCursor: string | undefined;
      if (comments.length > input.limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return { comments, nextCursor };
    }),

  create: protectedProcedure
    .input(
      z.object({
        causeId: z.string(),
        content: z.string().min(1).max(2000),
        parentId: z.string().optional(),
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
        where: { ipHash, type: "comment", createdAt: { gte: oneHourAgo } },
      });

      if (recentRequests >= COMMENT_RATE_LIMIT) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many comments. Please try again later.",
        });
      }

      await Promise.all([
        ctx.db.generationRequest.create({ data: { ipHash, type: "comment" } }),
        ctx.db.generationRequest.deleteMany({
          where: { type: "comment", createdAt: { lt: oneHourAgo } },
        }),
      ]);

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

  delete: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment || comment.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.comment.delete({ where: { id: input.commentId } });
      return { success: true };
    }),

  vote: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        voteType: z.enum(["UP", "DOWN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const existingVote = await tx.commentVote.findUnique({
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
            await tx.commentVote.delete({
              where: { id: existingVote.id },
            });
            await tx.comment.update({
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
            await tx.commentVote.update({
              where: { id: existingVote.id },
              data: { voteType: input.voteType },
            });
            await tx.comment.update({
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
        await tx.commentVote.create({
          data: {
            commentId: input.commentId,
            userId: ctx.user.id,
            voteType: input.voteType,
          },
        });
        await tx.comment.update({
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
      });
    }),
});
