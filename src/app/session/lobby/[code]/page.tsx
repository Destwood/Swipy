"use client";

import { useParams } from "next/navigation";
import { SessionLobbyClient } from "@/features/session/components/SessionLobbyClient";

export default function SessionLobbyByCodePage() {
  const params = useParams<{ code: string }>();
  const code = typeof params.code === "string" ? params.code : "";

  if (!code) {
    return null;
  }

  return <SessionLobbyClient code={code} />;
}
