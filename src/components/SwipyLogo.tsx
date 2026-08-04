import Link from "next/link";

interface Props {
  size?: "hero" | "bar";
  href?: string;
}

export function SwipyLogo({ size = "bar", href = "/" }: Props) {
  const isHero = size === "hero";
  const className = isHero
    ? "font-display text-[clamp(64px,8vw,104px)] font-extrabold leading-none tracking-[-0.04em] text-sw-text select-none"
    : "font-display text-[22px] font-extrabold leading-none tracking-[-0.02em] text-sw-text select-none";

  if (isHero) {
    return <span className={className}>Swipy</span>;
  }

  return (
    <Link href={href} className={className}>
      Swipy
    </Link>
  );
}
