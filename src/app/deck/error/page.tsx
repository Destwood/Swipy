import Link from "next/link";
import AlertCircleIcon from "@/assets/icons/alert-circle.svg";
import { ActionButton } from "@/shared/ui/ActionButton";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import styles from "./page.module.css";

export default function DeckErrorPage() {
  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.stage}>
        <ActionButton type="dislike" muted />

        <div className={styles.errorCard}>
          <div className={styles.iconWrap}>
            <AlertCircleIcon width={22} height={22} aria-hidden />
          </div>

          <div className={styles.textBlock}>
            <p className={styles.title}>Couldn&apos;t load games</p>
            <p className={styles.message}>Check your connection and try again.</p>
          </div>

          <Link href="/deck" className={styles.retryLink}>
            Try again
          </Link>
        </div>

        <ActionButton type="like" muted />
      </div>
    </div>
  );
}
