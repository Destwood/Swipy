"use client";

import { PreferenceToggle } from "@/shared/ui/PreferenceToggle";
import { useCustomCursorPreference } from "./use-custom-cursor-preference";

/** Menu row for the custom cursor. No-op on touch / coarse pointers. */
export function CustomCursorToggle() {
  const { ready, capable, enabled, setEnabled } = useCustomCursorPreference();

  if (!ready || !capable) return null;

  return (
    <PreferenceToggle
      label="Custom cursor"
      checked={enabled}
      onChange={setEnabled}
    />
  );
}
