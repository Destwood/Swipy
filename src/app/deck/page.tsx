import { ActionButton } from "@/shared/ui/ActionButton";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GameCard } from "@/features/games/components/GameCard";
import styles from "./page.module.css";

/** Static layout preview — real swipe uses /session. */
export default function DeckPage() {
  return (
    <div className={styles.root}>
      <div aria-hidden className={styles.radialOverlay} />

      <AppTopBar showLikedLink remainingLabel="0 left" />

      <div className={styles.stage}>
        <div className={styles.cardRow}>
          <ActionButton type="dislike" />

          <div className={styles.cardStack}>
            <div className={styles.emptyHint}>
              Open a session to swipe real deck games.
            </div>
          </div>

          <ActionButton type="like" />
        </div>

        <div className={styles.hints}>
          <span>← Dislike</span>
          <span className={styles.hintDivider}>·</span>
          <span>Like →</span>
        </div>
      </div>
    </div>
  );
}
