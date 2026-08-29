"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthUser } from "@/features/auth/lib/use-auth-user";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import styles from "./AccountShell.module.css";

const NAV = [
  { href: "/account", label: "Profile", exact: true },
  { href: "/account/preferences", label: "Preferences", exact: false },
  { href: "/ignored", label: "Ignored games", exact: true },
  { href: "/account/integrations", label: "Integrations", exact: false },
] as const;

type Props = {
  title: string;
  children: ReactNode;
};

export function AccountShell({ title, children }: Props) {
  const { user, ready } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname() ?? "/account";

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      <div className={styles.root}>
        <AppTopBar />
        <div className={styles.loading}>Loading account…</div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.scroll}>
        <div className={styles.page}>
          <nav className={styles.nav} aria-label="Account sections">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink}${active ? ` ${styles.navLinkActive}` : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.main}>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.body}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
