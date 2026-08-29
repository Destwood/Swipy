/**
 * Where Steam store links open.
 * Preference: localStorage `swipy.steamOpenTarget` (`web` | `app`).
 */
export type SteamOpenTarget = "web" | "app";

const STORAGE_KEY = "swipy.steamOpenTarget";
const CHANGE_EVENT = "swipy:steam-open-target";

/** Read preferred Steam open target. Default: browser tab. */
export function getSteamOpenTarget(): SteamOpenTarget {
  if (typeof window === "undefined") return "web";
  try {
    return localStorage.getItem(STORAGE_KEY) === "app" ? "app" : "web";
  } catch {
    return "web";
  }
}

export function setSteamOpenTarget(target: SteamOpenTarget) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, target);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, { detail: { target } }),
  );
}

export function subscribeSteamOpenTarget(
  onChange: (target: SteamOpenTarget) => void,
) {
  function fromStorage() {
    onChange(getSteamOpenTarget());
  }
  function fromEvent(e: Event) {
    const detail = (e as CustomEvent<{ target: SteamOpenTarget }>).detail;
    onChange(detail?.target ?? getSteamOpenTarget());
  }
  window.addEventListener("storage", fromStorage);
  window.addEventListener(CHANGE_EVENT, fromEvent);
  return () => {
    window.removeEventListener("storage", fromStorage);
    window.removeEventListener(CHANGE_EVENT, fromEvent);
  };
}

/** Opens the game's Steam store page in the Steam client when possible. */
export function steamStoreAppUrl(appId: string): string {
  return `steam://store/${appId}`;
}

export function steamStoreWebUrl(appId: string): string {
  return `https://store.steampowered.com/app/${appId}`;
}

export function steamDbUrl(appId: string): string {
  return `https://steamdb.info/app/${appId}/`;
}

/** Store URL for the current (or explicit) open target. */
export function steamStoreUrl(
  appId: string,
  target: SteamOpenTarget = getSteamOpenTarget(),
): string {
  return target === "app" ? steamStoreAppUrl(appId) : steamStoreWebUrl(appId);
}

/**
 * Open a game in Steam store according to preference.
 * `web` → new browser tab; `app` → Steam client protocol.
 */
export function openSteamStore(
  appId: string,
  options?: { target?: SteamOpenTarget },
): void {
  if (typeof window === "undefined") return;
  const target = options?.target ?? getSteamOpenTarget();
  const url = steamStoreUrl(appId, target);
  if (target === "app") {
    window.location.href = url;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
