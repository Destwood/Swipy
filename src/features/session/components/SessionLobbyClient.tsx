"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { MemberRow } from "@/features/session/components/MemberRow";
import { SessionCodeCopy } from "@/features/session/components/SessionCodeCopy";
import type { SessionMember } from "@/features/session/data/session";
import { getDeckById, setActiveDeckId } from "@/features/decks/lib/deck-store";
import {
  getActiveSession,
  getMembershipByCode,
  normalizeCode,
  setActiveSession,
  toUiMember,
  type ActiveSession,
} from "@/features/session/lib/session-context";
import { useSessionDisplayName } from "@/features/session/lib/use-session-display-name";
import {
  fetchMembers,
  fetchSession,
  fetchSessionByCode,
  joinGuestSession,
  startSessionSwiping,
  subscribeToMembers,
} from "@/features/session/lib/sessions";
import { Button, ButtonVariant } from "@/shared/ui/Button";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import styles from "@/app/session/lobby/page.module.css";

type Props = {
  code: string;
};

function resolveActiveForCode(
  code: string,
  sessionId: string,
  deckId: string,
): ActiveSession | null {
  const normalized = normalizeCode(code);
  const current = getActiveSession();
  if (current && current.sessionId === sessionId) {
    if (current.deckId !== deckId || current.code !== normalized) {
      const next = { ...current, code: normalized, deckId };
      setActiveSession(next);
      return next;
    }
    return current;
  }

  const cached = getMembershipByCode(normalized);
  if (!cached || cached.sessionId !== sessionId) return null;

  const restored: ActiveSession = {
    sessionId: cached.sessionId,
    memberId: cached.memberId,
    code: normalized,
    deckId,
    isHost: cached.isHost,
    displayName: cached.displayName,
    guestToken: cached.guestToken,
  };
  setActiveSession(restored);
  return restored;
}

export function SessionLobbyClient({ code: rawCode }: Props) {
  const router = useRouter();
  const code = normalizeCode(rawCode);
  const [deckLabel, setDeckLabel] = useState("…");
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigatedToDeck = useRef(false);
  const { displayName, setDisplayName, ready: nameReady, askForName } =
    useSessionDisplayName("Guest");

  const reloadLobby = useCallback(async () => {
    const session = await fetchSessionByCode(code);
    if (!session) {
      setError("Lobby not found. Check the link or code.");
      setNeedsJoin(false);
      setLoading(false);
      return;
    }

    setSessionId(session.id);
    setActiveDeckId(session.deck_id);

    const active = resolveActiveForCode(code, session.id, session.deck_id);
    if (!active) {
      setNeedsJoin(true);
      setIsHost(false);
      const deck = await getDeckById(session.deck_id);
      setDeckLabel(
        deck
          ? `${deck.name} · ${deck.gameIds.length} games`
          : session.deck_name || session.deck_id,
      );
      setLoading(false);
      if (session.status === "swiping") {
        setError("This session already started. Ask the host for a new lobby.");
      }
      return;
    }

    setNeedsJoin(false);
    setIsHost(active.isHost);

    const [freshSession, dbMembers] = await Promise.all([
      fetchSession(session.id),
      fetchMembers(session.id),
    ]);

    const deck = await getDeckById(freshSession.deck_id);
    setDeckLabel(
      deck
        ? `${deck.name} · ${deck.gameIds.length} games`
        : freshSession.deck_name || freshSession.deck_id,
    );
    setMembers(dbMembers.map(toUiMember));
    setLoading(false);

    if (freshSession.status === "swiping" && !navigatedToDeck.current) {
      navigatedToDeck.current = true;
      router.push("/session/deck");
    }
  }, [code, router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void reloadLobby().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Failed to load lobby");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadLobby]);

  useEffect(() => {
    if (!sessionId || needsJoin) return;

    const unsub = subscribeToMembers(sessionId, () => {
      void reloadLobby().catch(() => undefined);
    });

    const poll = window.setInterval(() => {
      void reloadLobby().catch(() => undefined);
    }, 2000);

    return () => {
      unsub();
      window.clearInterval(poll);
    };
  }, [sessionId, needsJoin, reloadLobby]);

  async function onJoin() {
    if (busy || !nameReady) return;
    setBusy(true);
    setError(null);
    try {
      const active = await joinGuestSession({ code, displayName });
      setActiveDeckId(active.deckId);
      setNeedsJoin(false);
      await reloadLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setBusy(false);
    }
  }

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

  const readyCount = members.filter((m) => m.status !== "waiting").length;
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/session/lobby/${encodeURIComponent(code)}`
      : code;

  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.content}>
        <div className={styles.inner}>
          <PageBackLink href="/session">← Session</PageBackLink>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Lobby</p>
              <h1 className={styles.title}>
                {needsJoin ? "Join this lobby" : "Friends in this session"}
              </h1>
              <p className={styles.deckLabel}>
                Deck: <span className={styles.deckName}>{deckLabel}</span>
              </p>
            </div>
            {!needsJoin ? (
              <span className={styles.readyCount}>
                {readyCount}/{members.length} ready
              </span>
            ) : null}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {loading ? (
            <p className={styles.waitingText}>Loading lobby…</p>
          ) : needsJoin ? (
            <div className={styles.actions}>
              {askForName ? (
                <label className={styles.joinField}>
                  <span className={styles.joinLabel}>Your name</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={styles.joinInput}
                    autoComplete="nickname"
                  />
                </label>
              ) : null}
              <Button
                type="button"
                onClick={() => void onJoin()}
                disabled={busy || !nameReady}
                variant={ButtonVariant.Accent}
              >
                {busy ? "Joining…" : "Join lobby"}
              </Button>
            </div>
          ) : (
            <>
              <section className={styles.invite} aria-label="Invite">
                <div className={styles.inviteCopy}>
                  <p className={styles.inviteTitle}>Invite friends</p>
                  <p className={styles.inviteText}>
                    Share the code or link while everyone joins.
                  </p>
                </div>
                <SessionCodeCopy
                  code={code}
                  copyValue={inviteUrl}
                  label="Session code"
                  hint="Click to copy lobby link"
                  align="start"
                  className={styles.inviteCode}
                />
              </section>

              <ul className={styles.memberList}>
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </ul>

              <div className={styles.actions}>
                {isHost ? (
                  <Button
                    type="button"
                    onClick={() => void onStart()}
                    disabled={busy || members.length === 0}
                    variant={ButtonVariant.Accent}
                  >
                    {busy ? "Starting…" : "Start session swipe"}
                  </Button>
                ) : (
                  <p className={styles.waitingText}>
                    Waiting for host to start…
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
