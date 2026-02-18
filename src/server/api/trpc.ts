import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "~/server/db";
import {
  createSupabaseServerClient,
  getServerAuth,
} from "~/lib/auth/supabase-server";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const auth = await getServerAuth();

  // If authenticated, ensure user exists in our DB
  let dbUser = null;
  if (auth.userId) {
    dbUser = await db.user.findUnique({
      where: { supabaseId: auth.userId },
    });

    // Auto-create user if they exist in Supabase but not in our DB
    if (!dbUser && auth.user?.email) {
      dbUser = await db.user.create({
        data: {
          email: auth.user.email,
          supabaseId: auth.userId,
          name: auth.user.user_metadata?.full_name ?? null,
          avatarUrl: auth.user.user_metadata?.avatar_url ?? null,
        },
      });
    }
  }

  return {
    db,
    auth,
    user: dbUser,
    headers: opts.headers,
    createSupabaseClient: createSupabaseServerClient,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.userId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      auth: { ...ctx.auth, userId: ctx.auth.userId },
      user: ctx.user,
    },
  });
});
