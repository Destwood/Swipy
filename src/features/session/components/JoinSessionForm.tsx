"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import { useSessionDisplayName } from "@/features/session/lib/use-session-display-name";
import { joinGuestSession } from "@/features/session/lib/sessions";
import { Button, ButtonVariant } from "@/shared/ui/Button";
import styles from "./JoinSessionForm.module.css";

export function JoinSessionForm() {
  const router = useRouter();
  const [code, setCode] = useState("SWPY-");
  const { displayName, setDisplayName, ready, askForName } =
    useSessionDisplayName("Guest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinLobby() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await joinGuestSession({ code, displayName });
      setActiveDeckId(session.deckId);
      router.push(
        `/session/lobby/${encodeURIComponent(session.code)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Join session</p>
      <h1 className={styles.title}>Enter the code</h1>
      <p className={styles.subtitle}>
        Ask the host for the session code, then jump into the lobby.
      </p>

      <div className={styles.form}>
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

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SWPY-XXXX"
            className={styles.codeInput}
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button
          type="button"
          onClick={() => void joinLobby()}
          disabled={busy || !ready || code.trim().length < 6}
          variant={ButtonVariant.Accent}
        >
          {busy ? "Joining…" : "Join lobby"}
        </Button>
        <Button href="/session" variant={ButtonVariant.Dark}>
          Create instead
        </Button>
      </div>
    </div>
  );
}
