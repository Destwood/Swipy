"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import { displayNameFromCurrentUser } from "@/features/session/lib/display-names";
import {
  createGuestSession,
  startSessionSwiping,
} from "@/features/session/lib/sessions";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./UseInSessionDialog.module.css";

type Props = {
  open: boolean;
  deckId: string | null;
  deckName?: string;
  onClose: () => void;
};

export function UseInSessionDialog({ open, deckId, deckName, onClose }: Props) {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const [busyMode, setBusyMode] = useState<"solo" | "together" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = busyMode !== null;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, busy]);

  useEffect(() => {
    if (open) {
      setError(null);
      setBusyMode(null);
    }
  }, [open, deckId]);

  function startTogether() {
    if (!deckId || busy) return;
    setBusyMode("together");
    setActiveDeckId(deckId);
    onClose();
    router.push("/session");
  }

  async function startSolo() {
    if (!deckId || busy) return;
    setBusyMode("solo");
    setError(null);
    try {
      setActiveDeckId(deckId);
      const displayName = (await displayNameFromCurrentUser()) ?? "You";
      const session = await createGuestSession({
        deckId,
        displayName,
      });
      await startSessionSwiping(session.sessionId);
      onClose();
      router.push("/session/deck");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start solo session");
      setBusyMode(null);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={styles.dialog}
      >
        <h2 id={titleId} className={styles.title}>
          Use in session
        </h2>
        <p id={descId} className={styles.description}>
          {deckName
            ? `Play “${deckName}” alone, or open a lobby for friends.`
            : "Play alone, or open a lobby for friends."}
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <div className={styles.modeRow}>
            <Button
              type="button"
              onClick={() => void startSolo()}
              disabled={busy || !deckId}
              variant={ButtonVariant.Accent}
              size={ButtonSize.Sm}
              className={styles.modeButton}
            >
              {busyMode === "solo" ? "Starting…" : "Solo"}
            </Button>
            <Button
              type="button"
              onClick={() => void startTogether()}
              disabled={busy || !deckId}
              variant={ButtonVariant.Dark}
              size={ButtonSize.Sm}
              className={styles.modeButton}
            >
              {busyMode === "together" ? "Opening…" : "Together"}
            </Button>
          </div>
          <Button
            type="button"
            onClick={onClose}
            disabled={busy}
            variant={ButtonVariant.Dark}
            size={ButtonSize.Sm}
            className={styles.modeButton}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
