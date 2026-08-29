"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import { useSessionDisplayName } from "@/features/session/lib/use-session-display-name";
import { joinGuestSession } from "@/features/session/lib/sessions";
import { Button, ButtonVariant } from "@/shared/ui/Button";
import { toast } from "@/shared/ui/toast";
import styles from "./JoinSessionForm.module.css";

function codeFromClipboard(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  const fromUrl = text.match(/SWPY-[A-Z0-9]{4}/);
  if (fromUrl) return fromUrl[0];
  const compact = text.replace(/\s+/g, "");
  const suffix = compact.replace(/^SWPY-?/, "");
  if (/^[A-Z0-9]{4}$/.test(suffix)) return `SWPY-${suffix}`;
  return null;
}

export function JoinSessionForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
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

  async function pasteCode() {
    if (busy) return;
    try {
      const raw = await navigator.clipboard.readText();
      const next = codeFromClipboard(raw);
      if (!next) {
        toast("No session code in clipboard");
        return;
      }
      setCode(next);
      setError(null);
    } catch {
      toast("Could not paste");
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

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label htmlFor="join-code" className={styles.fieldLabel}>
              Code
            </label>
            <button
              type="button"
              className={styles.paste}
              onClick={() => void pasteCode()}
              disabled={busy || !ready}
            >
              Paste
            </button>
          </div>
          <input
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SWPY-XXXX"
            className={styles.codeInput}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
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
