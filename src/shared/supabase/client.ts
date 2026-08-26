import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env",
    );
  }

  return { url, anonKey };
}

/** Browser Supabase client (Auth + cookie session). */
export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

/**
 * Guest session tables are RLS-scoped to `anon` in MVP.
 * Signed-in users would otherwise hit `authenticated` and get 403 inserts.
 * This client never attaches the Auth JWT.
 * Browser: reuse one instance so Realtime channels stay stable.
 */
let browserGuestClient: SupabaseClient<Database> | null = null;

export function createGuestDataClient(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseEnv();
  if (typeof window !== "undefined") {
    if (!browserGuestClient) {
      browserGuestClient = createClient<Database>(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }
    return browserGuestClient;
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

