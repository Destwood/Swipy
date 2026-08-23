"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/features/auth/lib/use-auth-user";
import {
  displayNameFromUser,
  pickRandomNickname,
  readSavedDisplayName,
  saveDisplayName,
} from "@/features/session/lib/display-names";

export function useSessionDisplayName(guestFallback = "") {
  const { user, ready: authReady } = useAuthUser();
  const [guestName, setGuestName] = useState(guestFallback);
  const [guestReady, setGuestReady] = useState(false);

  const isLoggedIn = Boolean(user);
  const accountName = displayNameFromUser(user);

  useEffect(() => {
    if (!authReady) return;
    if (user) {
      setGuestReady(true);
      return;
    }

    const saved = readSavedDisplayName();
    setGuestName(saved || guestFallback || pickRandomNickname());
    setGuestReady(true);
  }, [authReady, user, guestFallback]);

  const displayName = isLoggedIn
    ? (accountName ?? (guestFallback || "Player"))
    : guestName;

  function setDisplayName(value: string) {
    if (isLoggedIn) return;
    setGuestName(value);
    saveDisplayName(value);
  }

  return {
    displayName,
    setDisplayName,
    ready: authReady && guestReady,
    isLoggedIn,
    askForName: authReady && !isLoggedIn,
  };
}
