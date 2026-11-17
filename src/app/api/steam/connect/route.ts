import { NextResponse } from "next/server";
import { publicAppOrigin } from "@/features/auth/lib/auth-redirect";
import {
  buildSteamLoginUrl,
  STEAM_STATE_COOKIE,
} from "@/features/steam/lib/openid";
import { createServerSupabaseClient } from "@/shared/supabase/server";

export async function GET(request: Request) {
  const origin = publicAppOrigin(request);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const login = new URL("/login", origin);
    login.searchParams.set("next", "/account/integrations");
    return NextResponse.redirect(login);
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildSteamLoginUrl(origin, state));
  response.cookies.set(STEAM_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/api/steam",
    maxAge: 600,
  });
  return response;
}
