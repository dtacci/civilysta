export async function createSupabaseServerClient(readOnly = false) {
  const isBuild =
    typeof window === "undefined" &&
    typeof process !== "undefined" &&
    (process.env.NEXT_PHASE === "phase-production-build" ||
      (process.env.NODE_ENV === "production" &&
        process.env.VERCEL_ENV === "production" &&
        !process.env.VERCEL_URL));

  if (isBuild) {
    throw new Error("Supabase client not available during build");
  }

  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          if (readOnly) return;
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Expected in server components
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          if (readOnly) return;
          try {
            cookieStore.delete({ name, ...options });
          } catch {
            // Expected in server components
          }
        },
      },
    }
  );
}

export async function getServerAuth() {
  try {
    const supabase = await createSupabaseServerClient(true);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return {
      userId: user?.id ?? null,
      user: user ?? null,
      error,
    };
  } catch (error) {
    return {
      userId: null,
      user: null,
      error: error as Error,
    };
  }
}

export async function createSupabaseActionClient() {
  return await createSupabaseServerClient(false);
}
