import Link from "next/link";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { LikedRow } from "@/features/games/components/LikedRow";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import { SAMPLE_LIKED } from "@/features/games/data/games";
import styles from "./page.module.css";

export default function LikedPage() {
  const liked = SAMPLE_LIKED;

  return (
    <div className={styles.root}>
      <AppTopBar
        right={<span className={styles.countBadge}>{liked.length} liked</span>}
      >
        <div className={styles.topBarLeft}>
          <Link
            href="/deck"
            aria-label="Back to deck"
            className={styles.backLink}
          >
            <ChevronLeftIcon width={14} height={14} aria-hidden />
            Back
          </Link>
          <div className={styles.divider} />
          <SwipyLogo size="bar" />
        </div>
      </AppTopBar>

      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h1 className={styles.title}>Liked</h1>
            <span className={styles.count}>
              {liked.length} {liked.length === 1 ? "game" : "games"}
            </span>
          </div>

          <ul className={styles.list}>
            {liked.map((game) => (
              <LikedRow key={game.id} game={game} />
            ))}
          </ul>

          <p className={styles.footer}>
            Sample data · swipe logic later ·{" "}
            <Link href="/liked/empty" className={styles.footerLink}>
              empty state
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
