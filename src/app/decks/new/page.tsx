import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { CreateDeckForm } from "@/features/decks/components/CreateDeckForm";
import styles from "./page.module.css";

export default function NewDeckPage() {
  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content} data-deck-catalog-scroll>
        <CreateDeckForm />
      </div>
    </div>
  );
}
