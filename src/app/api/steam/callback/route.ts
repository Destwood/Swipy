import { NextResponse } from "next/server";
import { publicAppOrigin } from "@/features/auth/lib/auth-redirect";
import {
  STEAM_STATE_COOKIE,
  steamReturnTo,
  verifySteamLogin,
} from "@/features/steam/lib/openid";
import { clearSteamData, syncSteamAccount } from "@/features/steam/lib/sync";
import { createServerSupabaseClient } from "@/shared/supabase/server";

const UNIQUE_VIOLATION = "23505";

function finish(origin: string, result: string) {
  const url = new URL("/account/integrations", origin);
  url.searchParams.set("steam", result);
  const response = NextResponse.redirect(url);
  response.cookies.delete({ name: STEAM_STATE_COOKIE, path: "/api/steam" });
  return response;
}

export async function GET(request: Request) {
  const origin = publicAppOrigin(request);
  const { searchParams } = new URL(request.url);

  const cookieState = request.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((part) => part.startsWith(`${STEAM_STATE_COOKIE}=`))
    ?.slice(STEAM_STATE_COOKIE.length + 1);
  const state = searchParams.get("state");
  if (!cookieState || !state || cookieState !== state) {
    return finish(origin, "error");
  }

  const steamId = await verifySteamLogin(searchParams, steamReturnTo(origin, state));
  if (!steamId) return finish(origin, "error");

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    const login = new URL("/login", origin);
    login.searchParams.set("next", "/account/integrations");
    return NextResponse.redirect(login);
  }

  const { data: existing } = await supabase
    .from("steam_links")
    .select("steam_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.steam_id !== steamId) {
    await clearSteamData(supabase, user.id);
  }

  const { error } = await supabase.from("steam_links").upsert(
    {
      user_id: user.id,
      steam_id: steamId,
      ...(existing?.steam_id === steamId
        ? {}
        : {
            persona_name: null,
            avatar_url: null,
            profile_url: null,
            library_status: "pending",
            wishlist_status: "pending",
            linked_at: new Date().toISOString(),
            last_synced_at: null,
          }),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    return finish(origin, error.code === UNIQUE_VIOLATION ? "taken" : "error");
  }

  try {
    await syncSteamAccount(supabase, user.id, steamId);
  } catch {
    return finish(origin, "sync-failed");
  }
  return finish(origin, "connected");
}
