"use client";

import { Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DecksList } from "@/features/decks/components/DecksList";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { PageLoadingShell } from "@/features/shell/components/PageLoadingShell";
import { setSessionCreateDeckId } from "@/features/session/lib/session-create-deck";
import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import styles from "./page.module.css";

function SessionPickDeckPageInner() {
  const router = useRouter();
  const intent = useSearchParams().get("intent");
  const solo = intent === "solo";
  const picking = useRef(false);

  async function onPick(deckId: string) {
    if (picking.current) return;
    picking.current = true;
    setActiveDeckId(deckId);
    if (solo) {
      router.push("/deck");
      return;
    }
    setSessionCreateDeckId(deckId);
    router.push("/session");
  }

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content}>
        <DecksList
          mode="pick"
          onPick={onPick}
          pickHint={solo ? "Pick one deck to play alone." : undefined}
          back={
            solo ? (
              <PageBackLink href="/">← Home</PageBackLink>
            ) : (
              <PageBackLink href="/session">← Session</PageBackLink>
            )
          }
        />
      </div>
    </div>
  );
}

export default function SessionPickDeckPage() {
  return (
    <Suspense fallback={<PageLoadingShell />}>
      <SessionPickDeckPageInner />
    </Suspense>
  );
}
