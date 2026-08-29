"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import { startSoloSession } from "@/features/session/lib/start-solo-session";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./UseInSessionDialog.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  deckId?: string | null;
  deckName?: string;
  source?: "deck" | "home";
};

export function UseInSessionDialog({
  open,
  onClose,
  deckId = null,
  deckName,
  source = "deck",
}: Props) {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const [busyMode, setBusyMode] = useState<"solo" | "together" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = busyMode !== null;
  const fromHome = source === "home";
  const canStart = fromHome || Boolean(deckId);

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
  }, [open, deckId, source]);

  function startTogether() {
    if (!canStart || busy) return;
    setBusyMode("together");
    if (fromHome) {
      onClose();
      router.push("/session");
      return;
    }
    if (!deckId) return;
    setActiveDeckId(deckId);
    onClose();
    router.push("/session");
  }

  async function startSolo() {
    if (!canStart || busy) return;
    setBusyMode("solo");
    setError(null);
    if (fromHome) {
      onClose();
      router.push("/session/pick-deck?intent=solo");
      return;
    }
    if (!deckId) return;
    try {
      await startSoloSession(deckId);
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
          {fromHome ? "Find a game" : "Use in session"}
        </h2>
        <p id={descId} className={styles.description}>
          {fromHome
            ? "Choose a mode."
            : deckName
              ? `Play “${deckName}” alone, or open a lobby for friends.`
              : "Play alone, or open a lobby for friends."}
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <div className={styles.modeRow}>
            <Button
              type="button"
              onClick={() => void startSolo()}
              disabled={busy || !canStart}
              variant={ButtonVariant.Accent}
              size={ButtonSize.Sm}
              className={styles.modeButton}
            >
              {busyMode === "solo" ? "Starting…" : "Solo"}
            </Button>
            <Button
              type="button"
              onClick={() => void startTogether()}
              disabled={busy || !canStart}
              variant={ButtonVariant.Dark}
              size={ButtonSize.Sm}
              className={styles.modeButton}
            >
              {busyMode === "together" ? "Opening…" : "Together"}
            </Button>
          </div>
          {fromHome ? null : (
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
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
