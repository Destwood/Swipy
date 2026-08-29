import styles from "./GenreTag.module.css";

interface Props {
  label: string;
  accent?: boolean;
  compact?: boolean;
}

export function GenreTag({ label, accent = false, compact = false }: Props) {
  return (
    <span
      className={`${styles.tag} ${accent ? styles.accent : styles.default}${compact ? ` ${styles.compact}` : ""}`}
    >
      {label}
    </span>
  );
}
