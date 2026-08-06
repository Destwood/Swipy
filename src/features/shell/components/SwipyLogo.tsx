import Link from "next/link";
import styles from "./SwipyLogo.module.css";

interface Props {
  size?: "hero" | "bar";
  href?: string;
}

export function SwipyLogo({ size = "bar", href = "/" }: Props) {
  const isHero = size === "hero";
  const className = isHero ? styles.hero : styles.bar;

  if (isHero) {
    return <span className={className}>Swipy</span>;
  }

  return (
    <Link href={href} className={className}>
      Swipy
    </Link>
  );
}
