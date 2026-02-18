import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { generateUniqueSlug } from "~/lib/landing-page/slug-generator";
import { generateCauseContent } from "~/lib/ai/cause-generator";
import { generateCauseImages } from "~/lib/ai/image-generator";
import { TRPCError } from "@trpc/server";

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

      if (!cause || cause.status === "ARCHIVED") {
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
    .mutation(async ({ input }) => {
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
        selectedImageUrl: z.string().url().optional(),
        heroHeadline: z.string().optional(),
        heroSubheadline: z.string().optional(),
        heroBullets: z.array(z.string()).optional(),
        ctaText: z.string().optional(),
        primaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = await generateUniqueSlug(input.title);

      const cause = await ctx.db.cause.create({
        data: {
          slug,
          title: input.title,
          description: input.description,
          goal: input.goal,
          imageUrl: input.selectedImageUrl,
          status: "PUBLISHED",
          creatorId: ctx.user.id,
          landingPage: {
            create: {
              status: "PUBLISHED",
              publishedAt: new Date(),
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

      return { slug: cause.slug, id: cause.id };
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.cause.findMany({
      where: { creatorId: ctx.user.id },
      include: {
        _count: { select: { supporters: true, comments: true } },
        images: { where: { isSelected: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        description: z.string().min(10).max(2000).optional(),
        goal: z.string().max(500).optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cause = await ctx.db.cause.findUnique({
        where: { id: input.id },
      });

      if (!cause || cause.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, ...data } = input;
      return ctx.db.cause.update({ where: { id }, data });
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
});
