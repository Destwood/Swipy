const OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";
const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

export const STEAM_STATE_COOKIE = "swipy_steam_state";

export function steamReturnTo(origin: string, state: string): string {
  const url = new URL("/api/steam/callback", origin);
  url.searchParams.set("state", state);
  return url.toString();
}

export function buildSteamLoginUrl(origin: string, state: string): string {
  const url = new URL(OPENID_ENDPOINT);
  url.searchParams.set("openid.ns", OPENID_NS);
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", steamReturnTo(origin, state));
  url.searchParams.set("openid.realm", origin);
  url.searchParams.set("openid.identity", IDENTIFIER_SELECT);
  url.searchParams.set("openid.claimed_id", IDENTIFIER_SELECT);
  return url.toString();
}

export function steamIdFromClaimedId(claimedId: string | null): string | null {
  return claimedId?.match(CLAIMED_ID_RE)?.[1] ?? null;
}

/** Returns the verified SteamID64, or null when the assertion is invalid. */
export async function verifySteamLogin(
  params: URLSearchParams,
  expectedReturnTo: string,
): Promise<string | null> {
  if (params.get("openid.mode") !== "id_res") return null;
  if (params.get("openid.op_endpoint") !== OPENID_ENDPOINT) return null;
  if (params.get("openid.return_to") !== expectedReturnTo) return null;

  const claimedId = params.get("openid.claimed_id");
  const steamId = steamIdFromClaimedId(claimedId);
  if (!steamId || params.get("openid.identity") !== claimedId) return null;

  const body = new URLSearchParams();
  for (const [key, value] of params) {
    if (key.startsWith("openid.")) body.set(key, value);
  }
  body.set("openid.mode", "check_authentication");

  try {
    const res = await fetch(OPENID_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return /^is_valid:true$/m.test(text) ? steamId : null;
  } catch {
    return null;
  }
}
