"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { MemberRow } from "@/features/session/components/MemberRow";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import type { SessionMember } from "@/features/session/data/session";
import { getDeckById, setActiveDeckId } from "@/features/decks/lib/deck-store";
import { getActiveSession, toUiMember } from "@/features/session/lib/session-context";
import {
  fetchMembers,
  fetchSession,
  startSessionSwiping,
  subscribeToMembers,
} from "@/features/session/lib/sessions";
import styles from "./page.module.css";

export default function SessionLobbyPage() {
  const router = useRouter();
  const [code, setCode] = useState("…");
  const [deckLabel, setDeckLabel] = useState("…");
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const active = getActiveSession();
    if (!active) {
      setError("No active session. Create or join one first.");
      return;
    }

    const [session, dbMembers] = await Promise.all([
      fetchSession(active.sessionId),
      fetchMembers(active.sessionId),
    ]);

    setCode(session.code);
    setIsHost(active.isHost);
    setActiveDeckId(session.deck_id);
    const deck = getDeckById(session.deck_id);
    setDeckLabel(
      deck ? `${deck.name} · ${deck.gameIds.length} games` : session.deck_id,
    );
    setMembers(dbMembers.map(toUiMember));

    if (session.status === "swiping") {
      router.push("/session/deck");
    }
  }

  useEffect(() => {
    const active = getActiveSession();
    if (!active) {
      setError("No active session. Create or join one first.");
      return;
    }

    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load lobby"),
    );

    return subscribeToMembers(active.sessionId, () => {
      void reload().catch(() => undefined);
    });
  }, [router]);

  async function onStart() {
    const active = getActiveSession();
    if (!active || busy) return;
    setBusy(true);
    setError(null);
    try {
      await startSessionSwiping(active.sessionId);
      router.push("/session/deck");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
      setBusy(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      setError("Could not copy code");
    }
  }

  const readyCount = members.filter((m) => m.status !== "waiting").length;

  return (
    <div className={styles.root}>
      <AppTopBar right={<span className={styles.codeBadge}>{code}</span>}>
        <div className={styles.topBarLeft}>
          <Link href="/session" className={styles.backLink}>
            <ChevronLeftIcon width={14} height={14} aria-hidden />
            Back
          </Link>
          <div className={styles.divider} />
          <SwipyLogo size="bar" />
        </div>
      </AppTopBar>

      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Lobby</p>
              <h1 className={styles.title}>Friends in this session</h1>
              <p className={styles.deckLabel}>
                Deck: <span className={styles.deckName}>{deckLabel}</span>
              </p>
            </div>
            <span className={styles.readyCount}>
              {readyCount}/{members.length} ready
            </span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <ul className={styles.memberList}>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </ul>

          <div className={styles.actions}>
            {isHost ? (
              <button
                type="button"
                onClick={() => void onStart()}
                disabled={busy || members.length === 0}
                className={styles.startButton}
              >
                {busy ? "Starting…" : "Start session swipe"}
              </button>
            ) : (
              <p className={styles.waitingText}>Waiting for host to start…</p>
            )}
            <button
              type="button"
              onClick={() => void copyCode()}
              className={styles.copyButton}
            >
              Copy invite code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
