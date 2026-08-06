"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Deck } from "@/features/decks/data/decks";
import { getActiveDeckId, listDecks, setActiveDeckId } from "@/features/decks/lib/deck-store";
import { generateSessionCode } from "@/features/session/lib/session-context";
import { useSessionDisplayName } from "@/features/session/lib/use-session-display-name";
import { createGuestSession } from "@/features/session/lib/sessions";
import styles from "./CreateSessionForm.module.css";

export function CreateSessionForm() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const { displayName, setDisplayName } = useSessionDisplayName("Host");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState("SWPY-····");

  useEffect(() => {
    const all = listDecks();
    setDecks(all);
    const active = getActiveDeckId();
    const initial =
      (active && all.some((d) => d.id === active) && active) || all[0]?.id || "";
    setDeckId(initial);
    setSessionCode(generateSessionCode());
  }, []);

  async function openLobby() {
    if (!deckId || busy) return;
    setBusy(true);
    setError(null);
    try {
      setActiveDeckId(deckId);
      await createGuestSession({
        deckId,
        displayName,
        code: sessionCode,
      });
      router.push("/session/lobby");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
      setBusy(false);
    }
  }

  const selected = decks.find((d) => d.id === deckId);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Your name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
            autoComplete="nickname"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Deck</span>
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className={styles.select}
          >
            {decks.length === 0 && <option value="">No decks yet</option>}
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.gameIds.length} games)
              </option>
            ))}
          </select>
          {selected && (
            <span className={styles.deckHint}>
              {selected.description ?? `${selected.gameIds.length} games in this deck`}
            </span>
          )}
        </label>

        <div className={styles.codeSection}>
          <span className={styles.codeLabel}>Session code</span>
          <span className={styles.code}>{sessionCode}</span>
          <span className={styles.codeHint}>Share after you open the lobby</span>
        </div>

        <Link href="/decks/new" className={styles.newDeckLink}>
          Or create a new deck →
        </Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => void openLobby()}
          disabled={!deckId || busy}
          className={styles.primaryButton}
        >
          {busy ? "Creating…" : "Open lobby"}
        </button>
        <Link href="/session/join" className={styles.secondaryLink}>
          I have a code
        </Link>
      </div>
    </div>
  );
}
