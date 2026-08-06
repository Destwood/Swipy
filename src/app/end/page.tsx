import Image from "next/image";
import Link from "next/link";
import HeartIcon from "@/assets/icons/heart.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { HERO_IMG } from "@/features/games/data/games";
import styles from "./page.module.css";

export default function EndPage() {
  return (
    <div className={styles.root}>
      <Image
        src={HERO_IMG}
        alt=""
        aria-hidden
        fill
        className={styles.heroImage}
        sizes="100vw"
      />
      <div aria-hidden className={styles.radialOverlay} />

      <AppTopBar />

      <div className={styles.content}>
        <div className={styles.badge}>
          <HeartIcon width={14} height={14} className={styles.badgeIcon} aria-hidden />
          <span className={styles.badgeLabel}>4 liked</span>
        </div>

        <h1 className={styles.title}>That&apos;s the deck.</h1>

        <p className={styles.subtitle}>See what you liked or keep going.</p>

        <div className={styles.actions}>
          <Link href="/liked" className={styles.primaryLink}>
            <HeartIcon width={15} height={15} className={styles.primaryIcon} aria-hidden />
            View liked
          </Link>
          <Link href="/deck" className={styles.secondaryLink}>
            Swipe again
          </Link>
        </div>
      </div>
    </div>
  );
}
