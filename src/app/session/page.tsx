import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { CreateSessionForm } from "@/features/session/components/CreateSessionForm";
import styles from "./page.module.css";

export default function SessionCreatePage() {
  return (
    <div className={styles.root}>
      <div aria-hidden className={styles.radialOverlay} />
      <AppTopBar />
      <CreateSessionForm />
    </div>
  );
}
