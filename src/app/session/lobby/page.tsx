"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveSession, normalizeCode } from "@/features/session/lib/session-context";

/** Legacy `/session/lobby` → `/session/lobby/[code]`. */
export default function SessionLobbyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const active = getActiveSession();
    if (active?.code) {
      router.replace(`/session/lobby/${encodeURIComponent(normalizeCode(active.code))}`);
      return;
    }
    router.replace("/session");
  }, [router]);

  return null;
}
