const APP_ID_RE = /\/app\/(\d+)/;

/** Some titles use a different Steam app id per region (e.g. 205100 → 217980 in UA). */
export async function resolveRegionalSteamAppId(
  appId: string,
  cc: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/app/${appId}/?cc=${encodeURIComponent(cc)}`,
      { redirect: "manual", next: { revalidate: 86_400 } },
    );
    const location = res.headers.get("location");
    if (!location) return null;
    const match = location.match(APP_ID_RE);
    const regionalId = match?.[1];
    if (!regionalId || regionalId === appId) return null;
    return regionalId;
  } catch {
    return null;
  }
}
