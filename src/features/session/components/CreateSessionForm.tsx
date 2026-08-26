"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Deck } from "@/features/decks/data/decks";
import { listDecks, setActiveDeckId } from "@/features/decks/lib/deck-store";
import { useSessionDisplayName } from "@/features/session/lib/use-session-display-name";
import { createGuestSession } from "@/features/session/lib/sessions";
import {
  clearSessionCreateCode,
  getOrCreateSessionCreateCode,
  getSessionCreateDeckId,
  setSessionCreateDeckId,
} from "@/features/session/lib/session-create-deck";
import { SessionCodeCopy } from "@/features/session/components/SessionCodeCopy";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./CreateSessionForm.module.css";

export function CreateSessionForm() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const { displayName, setDisplayName, ready, askForName } =
    useSessionDisplayName("Host");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState("SWPY-····");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const all = await listDecks();
      if (cancelled) return;
      setDecks(all);
      const pending = getSessionCreateDeckId();
      setDeckId(
        pending && all.some((d) => d.id === pending) ? pending : "",
      );
      setSessionCode(getOrCreateSessionCreateCode());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openLobby() {
    if (!deckId || busy) return;
    setBusy(true);
    setError(null);
    try {
      setActiveDeckId(deckId);
      setSessionCreateDeckId(deckId);
      const session = await createGuestSession({
        deckId,
        displayName,
        code: sessionCode,
      });
      clearSessionCreateCode();
      router.push(
        `/session/lobby/${encodeURIComponent(session.code)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
      setBusy(false);
    }
  }

  const selected = decks.find((d) => d.id === deckId);
  const canOpenLobby = Boolean(deckId) && !busy && ready;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {askForName ? (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Your name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.input}
              autoComplete="nickname"
            />
          </label>
        ) : null}

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Deck</span>
          <div className={styles.deckRow}>
            <div className={styles.deckInfo}>
              {selected ? (
                <>
                  <span className={styles.deckName}>{selected.name}</span>
                  <span className={styles.deckHint}>
                    {selected.description ??
                      `${selected.gameIds.length} games in this deck`}
                  </span>
                </>
              ) : (
                <span className={styles.deckEmpty}>Select deck</span>
              )}
            </div>
            <Button
              href="/session/pick-deck"
              variant={ButtonVariant.Soft}
              size={ButtonSize.Sm}
              className={styles.deckAction}
            >
              {selected ? "Change deck" : "Select deck"}
            </Button>
          </div>
        </div>

        <div className={styles.codeSection}>
          <SessionCodeCopy
            code={sessionCode}
            hint="Share after you open the lobby"
          />
        </div>

        <Link href="/decks/new" className={styles.newDeckLink}>
          Or create a new deck →
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button
          type="button"
          onClick={() => void openLobby()}
          disabled={!canOpenLobby}
          variant={ButtonVariant.Accent}
        >
          {busy ? "Creating…" : "Open lobby"}
        </Button>
        <Button href="/session/join" variant={ButtonVariant.Dark}>
          I have a code
        </Button>
      </div>
    </div>
  );
}
