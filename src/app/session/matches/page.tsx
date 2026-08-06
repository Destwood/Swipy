import { SessionMatchesClient } from "@/features/session/components/SessionMatchesClient";
import styles from "./page.module.css";

export default function SessionMatchesPage() {
  return (
    <div className={styles.root}>
      <SessionMatchesClient />
    </div>
  );
}
