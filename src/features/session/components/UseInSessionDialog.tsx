"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import { saveDisplayName } from "@/features/session/lib/display-names";
import { useSessionDisplayName } from "@/features/session/lib/use-session-display-name";
import {
  createGuestSession,
  startSessionSwiping,
} from "@/features/session/lib/sessions";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { displayName, setDisplayName } = useSessionDisplayName();
  const [busyMode, setBusyMode] = useState<"solo" | "together" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = busyMode !== null;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
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
    setError(null);
    setActiveDeckId(deckId);
    saveDisplayName(displayName.trim() || pickFallbackName());
    onClose();
    router.push("/session");
  }

  function pickFallbackName() {
    return displayName.trim() || "Host";
  }

  async function startSolo() {
    if (!deckId || busy) return;
    setBusyMode("solo");
    setError(null);
    try {
      setActiveDeckId(deckId);
      const session = await createGuestSession({
        deckId,
        displayName: pickFallbackName(),
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
      className={styles.backdrop}
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
        className={styles.panel}
      >
        <h2 id={titleId} className={styles.title}>
          Use in session
        </h2>
        <p id={descId} className={styles.description}>
          {deckName
            ? `Play “${deckName}” alone, or open a lobby for friends.`
            : "Play alone, or open a lobby for friends."}
        </p>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Your name for this session</span>
          <input
            ref={inputRef}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={busy}
            className={styles.input}
            autoComplete="nickname"
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <div className={styles.modeRow}>
            <button
              type="button"
              onClick={() => void startSolo()}
              disabled={busy || !deckId}
              className={styles.solo}
            >
              {busyMode === "solo" ? "Starting…" : "Solo"}
            </button>
            <button
              type="button"
              onClick={() => void startTogether()}
              disabled={busy || !deckId}
              className={styles.together}
            >
              {busyMode === "together" ? "Opening…" : "Together"}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={styles.cancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
