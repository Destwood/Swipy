import Link from "next/link";
import CardsEmptyIcon from "@/assets/icons/cards-empty.svg";
import { ActionButton } from "@/shared/ui/ActionButton";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import styles from "./page.module.css";

export default function DeckEmptyPage() {
  return (
    <div className={styles.root}>
      <AppTopBar remainingLabel="0 left" />

      <div className={styles.stage}>
        <ActionButton type="dislike" muted />

        <div className={styles.emptyCard}>
          <div className={styles.iconWrap}>
            <div className={styles.ringOuter} />
            <div className={styles.ringMiddle} />
            <div className={styles.ringInner} />
            <CardsEmptyIcon width={18} height={18} aria-hidden />
          </div>

          <div className={styles.textBlock}>
            <p className={styles.title}>No games right now</p>
            <p className={styles.message}>
              We&apos;re loading new games. Check back soon.
            </p>
          </div>

          <Link href="/deck" className={styles.refreshLink}>
            Refresh
          </Link>
        </div>

        <ActionButton type="like" muted />
      </div>
    </div>
  );
}
