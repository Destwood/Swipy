"use client";

import { useEffect, useState } from "react";
import {
  canUseCustomCursor,
  readCustomCursorEnabled,
  subscribeCustomCursorEnabled,
  writeCustomCursorEnabled,
} from "./preference";

export function useCustomCursorPreference() {
  const [ready, setReady] = useState(false);
  const [capable, setCapable] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function syncCapability() {
      setCapable(canUseCustomCursor());
    }
    syncCapability();
    setEnabled(readCustomCursorEnabled());
    setReady(true);

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    mq.addEventListener("change", syncCapability);
    const unsub = subscribeCustomCursorEnabled(setEnabled);
    return () => {
      mq.removeEventListener("change", syncCapability);
      unsub();
    };
  }, []);

  function setCustomCursorEnabled(next: boolean) {
    setEnabled(next);
    writeCustomCursorEnabled(next);
  }

  return {
    ready,
    capable,
    enabled,
    active: ready && capable && enabled,
    setEnabled: setCustomCursorEnabled,
    toggle: () => setCustomCursorEnabled(!enabled),
  };
}
