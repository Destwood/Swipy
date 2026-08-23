import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";

export const FUNNY_NICKNAMES = [
  "Slow Penguin",
  "Bright Koala",
  "Quiet Falcon",
  "Clever Otter",
  "Fuzzy Badger",
  "Speedy Llama",
  "Cozy Panda",
  "Witty Fox",
  "Gentle Moose",
  "Lucky Quokka",
  "Peppy Seahorse",
  "Calm Walrus",
  "Jolly Hedgehog",
  "Nimble Axolotl",
  "Dreamy Capybara",
  "Zippy Platypus",
] as const;

const DISPLAY_NAME_KEY = "swipy.sessionDisplayName";

export function pickRandomNickname(): string {
  const i = Math.floor(Math.random() * FUNNY_NICKNAMES.length);
  return FUNNY_NICKNAMES[i]!;
}

export function displayNameFromUser(user: User | null | undefined): string | null {
  if (!user) return null;
  const meta = user.user_metadata;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    (typeof meta?.user_name === "string" && meta.user_name.trim()) ||
    "";
  if (fromMeta) return fromMeta;
  const emailName = user.email?.split("@")[0]?.trim();
  return emailName || null;
}

export function readSavedDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DISPLAY_NAME_KEY);
    const trimmed = raw?.trim();
    return trimmed || null;
  } catch {
    return null;
  }
}

export function saveDisplayName(name: string) {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export async function displayNameFromCurrentUser(): Promise<string | null> {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return displayNameFromUser(data.user);
  } catch {
    return null;
  }
}

/** Account name if signed in, else last guest nick, else a random nick. */
export async function resolveSessionDisplayName(): Promise<string> {
  const fromAccount = await displayNameFromCurrentUser();
  if (fromAccount) return fromAccount;

  const saved = readSavedDisplayName();
  if (saved) return saved;

  return pickRandomNickname();
}
