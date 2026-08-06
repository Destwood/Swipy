import styles from "./GenreTag.module.css";

interface Props {
  label: string;
  accent?: boolean;
}

export function GenreTag({ label, accent = false }: Props) {
  return (
    <span className={`${styles.tag} ${accent ? styles.accent : styles.default}`}>
      {label}
    </span>
  );
}
