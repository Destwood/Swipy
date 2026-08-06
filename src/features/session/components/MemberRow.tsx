import type { SessionMember } from "@/features/session/data/session";
import styles from "./MemberRow.module.css";

const STATUS_LABEL: Record<SessionMember["status"], string> = {
  ready: "Ready",
  waiting: "Joining…",
  swiping: "Swiping",
  done: "Done",
};

export function MemberRow({ member }: { member: SessionMember }) {
  return (
    <li className={styles.row}>
      <div
        className={styles.avatar}
        style={{ background: member.color }}
      >
        {member.initials}
      </div>
      <div className={styles.content}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{member.name}</span>
          {member.role === "host" && (
            <span className={styles.hostBadge}>Host</span>
          )}
        </div>
        <span className={styles.status}>{STATUS_LABEL[member.status]}</span>
      </div>
      <span
        className={`${styles.statusDot} ${
          member.status === "waiting" ? styles.statusDotWaiting : styles.statusDotActive
        }`}
        aria-hidden
      />
    </li>
  );
}
