import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "~/lib/auth/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient(false);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
    // Auth exchange failed — redirect with error
    const errorUrl = new URL(redirect || "/", origin);
    errorUrl.searchParams.set("auth_error", "link_expired");
    return NextResponse.redirect(errorUrl.toString());
  }

  // No code provided
  const errorUrl = new URL("/", origin);
  errorUrl.searchParams.set("auth_error", "missing_code");
  return NextResponse.redirect(errorUrl.toString());
}
