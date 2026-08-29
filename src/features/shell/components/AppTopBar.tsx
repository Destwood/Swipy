"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StarIcon from "@/assets/icons/star.svg";
import { AuthMenu } from "@/features/auth/components/AuthMenu";
import { SwipyLogo } from "./SwipyLogo";
import styles from "./AppTopBar.module.css";

const NAV = [
  { href: "/decks", label: "Decks", match: (path: string) => path.startsWith("/decks") },
  {
    href: "/library",
    label: "Games",
    match: (path: string) => path.startsWith("/library"),
  },
] as const;

export function AppTopBar() {
  const pathname = usePathname() ?? "";

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <SwipyLogo size="bar" />
        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className={styles.right}>
        <Link href="/liked" className={styles.likedLink}>
          <StarIcon className={styles.likedIcon} aria-hidden />
          Favorites
        </Link>
        <AuthMenu />
      </div>
    </div>
  );
}
