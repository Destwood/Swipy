import { SessionDeckClient } from "@/features/session/components/SessionDeckClient";
import styles from "./page.module.css";

export default function SessionDeckPage() {
  return (
    <div className={styles.root}>
      <SessionDeckClient />
    </div>
  );
}
