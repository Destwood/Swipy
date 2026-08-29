const STORAGE_KEY = "swipy.customCursor";
const CHANGE_EVENT = "swipy:custom-cursor";

export function canUseCustomCursor() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function readCustomCursorEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return false;
    return raw === "1";
  } catch {
    return false;
  }
}

export function writeCustomCursorEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, { detail: { enabled } }),
  );
}

export function subscribeCustomCursorEnabled(
  onChange: (enabled: boolean) => void,
) {
  function fromStorage() {
    onChange(readCustomCursorEnabled());
  }
  function fromEvent(e: Event) {
    const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
    onChange(detail?.enabled ?? readCustomCursorEnabled());
  }
  window.addEventListener("storage", fromStorage);
  window.addEventListener(CHANGE_EVENT, fromEvent);
  return () => {
    window.removeEventListener("storage", fromStorage);
    window.removeEventListener(CHANGE_EVENT, fromEvent);
  };
}
