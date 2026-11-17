import { NextResponse } from "next/server";
import { syncSteamAccount } from "@/features/steam/lib/sync";
import { STEAM_SYNC_COOLDOWN_MS } from "@/features/steam/lib/types";
import { createServerSupabaseClient } from "@/shared/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: link } = await supabase
    .from("steam_links")
    .select("steam_id, last_synced_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!link) {
    return NextResponse.json({ error: "Steam is not connected" }, { status: 404 });
  }

  const last = link.last_synced_at ? Date.parse(link.last_synced_at) : 0;
  if (Date.now() - last < STEAM_SYNC_COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const result = await syncSteamAccount(supabase, user.id, link.steam_id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
