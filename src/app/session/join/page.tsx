import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { JoinSessionForm } from "@/features/session/components/JoinSessionForm";
import styles from "./page.module.css";

export default function SessionJoinPage() {
  return (
    <div className={styles.root}>
      <div aria-hidden className={styles.radialOverlay} />
      <AppTopBar />
      <JoinSessionForm />
    </div>
  );
}
