import Image from "next/image";
import Link from "next/link";
import ArrowRightIcon from "@/assets/icons/arrow-right.svg";
import { HERO_IMG } from "@/features/games/data/games";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.root}>
      <Image
        src={HERO_IMG}
        alt="Dark atmospheric bokeh lights"
        fill
        priority
        className={styles.heroImage}
        sizes="100vw"
      />

      <div aria-hidden className={styles.radialOverlay} />

      <div aria-hidden className={styles.bottomGradient} />

      <AppTopBar />

      <div className={styles.content}>
        <SwipyLogo size="hero" />

        <p className={styles.tagline}>Swipe with friends. Pick what to play.</p>

        <div className={styles.actions}>
          <Link href="/session" className={styles.primaryLink}>
            Play with friends
            <ArrowRightIcon width={16} height={16} className={styles.primaryIcon} aria-hidden />
          </Link>
          <Link href="/decks" className={styles.secondaryLink}>
            Manage decks
          </Link>
          <Link href="/library" className={styles.secondaryLink}>
            Browse games
          </Link>
        </div>
      </div>
    </div>
  );
}
