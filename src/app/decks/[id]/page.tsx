import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { DeckDetail } from "@/features/decks/components/DeckDetail";
import styles from "../new/page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DeckDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content}>
        <DeckDetail deckId={decodeURIComponent(id)} />
      </div>
    </div>
  );
}
