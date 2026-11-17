"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_LIBRARY_FILTER,
  type LibraryFilter,
  type SteamLibraryMode,
} from "@/features/steam/lib/library-filter";
import {
  autoSyncSteamIfStale,
  disconnectSteam,
  fetchSteamLink,
  hydrateSteamLibrary,
  readLibraryFilter,
  setSteamLibraryMode,
  subscribeLibraryFilter,
  syncSteamNow,
} from "@/features/steam/lib/steam-library";
import type { SteamLink } from "@/features/steam/lib/types";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";

export function useLibraryFilter(): LibraryFilter {
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY_LIBRARY_FILTER);

  useEffect(() => {
    setFilter(readLibraryFilter());
    return subscribeLibraryFilter(setFilter);
  }, []);

  return filter;
}

export function useSteamConnection() {
  const filter = useLibraryFilter();
  const [link, setLink] = useState<SteamLink | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLink(await fetchSteamLink());
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function sync(): Promise<boolean> {
    setBusy(true);
    try {
      const ok = await syncSteamNow();
      await hydrateSteamLibrary();
      await refresh();
      return ok;
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(): Promise<boolean> {
    setBusy(true);
    try {
      const ok = await disconnectSteam();
      await refresh();
      return ok;
    } finally {
      setBusy(false);
    }
  }

  return {
    ready,
    busy,
    link,
    mode: filter.mode,
    ownedCount: filter.owned.size,
    wishlistCount: filter.wishlist.size,
    setMode: (mode: SteamLibraryMode) => setSteamLibraryMode(mode),
    sync,
    disconnect,
    refresh,
  };
}

export function useSteamBackgroundSync() {
  useEffect(() => {
    let cancelled = false;
    async function run() {
      await hydrateSteamLibrary();
      if (cancelled) return;
      await autoSyncSteamIfStale();
    }
    void run();
    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void run();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
}
