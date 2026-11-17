import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { CreateDeckForm } from "@/features/decks/components/CreateDeckForm";
import styles from "../../new/page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditDeckPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content}>
        <CreateDeckForm deckId={decodeURIComponent(id)} />
      </div>
    </div>
  );
}
