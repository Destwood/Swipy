import { NextResponse } from "next/server";
import { publicAppOrigin, safeNextPath } from "@/features/auth/lib/auth-redirect";
import { createServerSupabaseClient } from "@/shared/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicAppOrigin(request);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
