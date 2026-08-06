"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeartIcon from "@/assets/icons/heart.svg";
import { AuthMenu } from "@/features/auth/components/AuthMenu";
import { SwipyLogo } from "./SwipyLogo";
import styles from "./AppTopBar.module.css";

interface Props {
  children?: ReactNode;
  right?: ReactNode;
  showLikedLink?: boolean;
  remainingLabel?: string;
  showNav?: boolean;
}

const NAV = [
  { href: "/decks", label: "Decks", match: (path: string) => path.startsWith("/decks") },
  {
    href: "/library",
    label: "Games",
    match: (path: string) => path.startsWith("/library"),
  },
] as const;

export function AppTopBar({
  children,
  right,
  showLikedLink = false,
  remainingLabel,
  showNav = true,
}: Props) {
  const pathname = usePathname() ?? "";

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        {children ?? (
          <>
            <SwipyLogo size="bar" />
            {showNav ? (
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
            ) : null}
          </>
        )}
      </div>
      <div className={styles.right}>
        {showLikedLink && (
          <Link href="/liked" className={styles.likedLink}>
            <HeartIcon className={styles.likedIcon} aria-hidden />
            Liked
          </Link>
        )}
        {remainingLabel !== undefined && (
          <span className={styles.remainingLabel}>{remainingLabel}</span>
        )}
        {right}
        <AuthMenu />
      </div>
    </div>
  );
}
