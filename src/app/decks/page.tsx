import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { DecksList } from "@/features/decks/components/DecksList";
import styles from "./page.module.css";

export default function DecksPage() {
  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content}>
        <DecksList />
      </div>
    </div>
  );
}
