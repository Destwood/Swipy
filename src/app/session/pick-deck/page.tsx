"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import { DecksList } from "@/features/decks/components/DecksList";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import { setSessionCreateDeckId } from "@/features/session/lib/session-create-deck";
import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import styles from "./page.module.css";

export default function SessionPickDeckPage() {
  const router = useRouter();

  function onPick(deckId: string) {
    setSessionCreateDeckId(deckId);
    setActiveDeckId(deckId);
    router.push("/session");
  }

  return (
    <div className={styles.root}>
      <AppTopBar>
        <div className={styles.topBarLeft}>
          <Link href="/session" className={styles.backLink}>
            <ChevronLeftIcon width={14} height={14} aria-hidden />
            Back
          </Link>
          <div className={styles.divider} />
          <SwipyLogo size="bar" href="/" />
        </div>
      </AppTopBar>
      <div className={styles.content}>
        <DecksList mode="pick" onPick={onPick} />
      </div>
    </div>
  );
}
