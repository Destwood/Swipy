import type { User } from "@supabase/supabase-js";

function firstHttpUrl(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  }
  return null;
}

export function googleAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const fromMeta = firstHttpUrl(meta.avatar_url, meta.picture);
  if (fromMeta) return fromMeta;

  for (const identity of user.identities ?? []) {
    if (identity.provider !== "google") continue;
    const data = identity.identity_data ?? {};
    const fromIdentity = firstHttpUrl(data.avatar_url, data.picture);
    if (fromIdentity) return fromIdentity;
  }

  return null;
}
