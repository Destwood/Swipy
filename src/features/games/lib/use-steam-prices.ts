"use client";

import { useEffect, useMemo, useState } from "react";
import {
  uniqueSteamAppIds,
  type SteamPrice,
} from "@/features/games/lib/steam-price";

const memory = new Map<string, SteamPrice | null>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
const CHUNK = 40;

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let fetching = false;

type PricesResponse = {
  prices?: Record<string, SteamPrice | null>;
};

function notify() {
  listeners.forEach((fn) => fn());
}

async function flush() {
  if (fetching) return;
  const ids = [...pending];
  pending.clear();
  if (ids.length === 0) return;
  fetching = true;
  try {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const res = await fetch(`/api/steam/prices?ids=${chunk.join(",")}`);
      if (!res.ok) continue;
      const data = (await res.json()) as PricesResponse;
      const prices = data.prices ?? {};
      for (const id of chunk) {
        memory.set(id, prices[id] ?? null);
      }
      notify();
    }
  } finally {
    fetching = false;
    if (pending.size > 0) void flush();
  }
}

function enqueue(ids: string[]) {
  let added = false;
  for (const id of ids) {
    if (!memory.has(id)) {
      pending.add(id);
      added = true;
    }
  }
  if (!added) return;
  if (fetching) return;
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 0);
}

export function useSteamPrices(appIds: Array<string | undefined | null>) {
  const key = uniqueSteamAppIds(appIds).join(",");
  const ids = useMemo(() => (key ? key.split(",") : []), [key]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    listeners.add(bump);
    enqueue(ids);
    return () => {
      listeners.delete(bump);
    };
  }, [ids]);

  const prices: Record<string, SteamPrice | null> = {};
  for (const id of ids) {
    if (memory.has(id)) prices[id] = memory.get(id) ?? null;
  }
  return prices;
}
