import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { causeRouter } from "~/server/api/routers/cause";
import { commentRouter } from "~/server/api/routers/comment";
import { supporterRouter } from "~/server/api/routers/supporter";

export const appRouter = createTRPCRouter({
  cause: causeRouter,
  comment: commentRouter,
  supporter: supporterRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
