"use client";

import { useEffect, useState } from "react";
import {
  resolveSessionDisplayName,
  saveDisplayName,
} from "@/features/session/lib/display-names";

export function useSessionDisplayName(initial = "") {
  const [displayName, setDisplayNameState] = useState(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void resolveSessionDisplayName().then((name) => {
      if (cancelled) return;
      setDisplayNameState(name);
      saveDisplayName(name);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function setDisplayName(value: string) {
    setDisplayNameState(value);
    saveDisplayName(value);
  }

  return { displayName, setDisplayName, ready };
}
