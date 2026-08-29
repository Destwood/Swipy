import Image from "next/image";
import { HERO_IMG } from "@/features/games/data/games";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { HomeFindGame } from "@/features/shell/components/HomeFindGame";
import { HomeInfiniteMode } from "@/features/shell/components/HomeInfiniteMode";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import { Button, ButtonVariant } from "@/shared/ui/Button";
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
          <div className={styles.primaryRow}>
            <HomeFindGame />
            <HomeInfiniteMode />
          </div>
          <Button href="/session/join" variant={ButtonVariant.Dark}>
            Join lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
