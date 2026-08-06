import Link from "next/link";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import HeartOutlineIcon from "@/assets/icons/heart-outline.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import styles from "./page.module.css";

export default function LikedEmptyPage() {
  return (
    <div className={styles.root}>
      <AppTopBar right={<span className={styles.countBadge}>0 liked</span>}>
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

      <div className={styles.emptyState}>
        <div className={styles.iconWrap}>
          <HeartOutlineIcon width={24} height={24} aria-hidden />
        </div>
        <div>
          <p className={styles.title}>No likes yet</p>
          <p className={styles.message}>
            Swipe right on games you&apos;d want to play.
          </p>
        </div>
        <Link href="/deck" className={styles.ctaLink}>
          Start swiping
        </Link>
      </div>
    </div>
  );
}
