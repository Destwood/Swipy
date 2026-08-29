import styles from "./MetacriticBadge.module.css";

type Props = {
  score: number;
};

function tone(score: number) {
  if (score >= 75) return styles.high;
  if (score >= 50) return styles.mid;
  return styles.low;
}

export function MetacriticBadge({ score }: Props) {
  return <span className={`${styles.badge} ${tone(score)}`}>{score}</span>;
}
