"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CustomCursorToggle } from "@/features/custom-cursor";
import { googleAvatarUrl } from "@/features/auth/lib/google-avatar";
import { useSteamOpenPreference } from "@/features/games/lib/use-steam-open-preference";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import { PreferenceToggle } from "@/shared/ui/PreferenceToggle";
import styles from "./AuthMenu.module.css";

export function AuthMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const steam = useSteamOpenPreference();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
  }

  if (!ready) {
    return <div className={styles.placeholder} aria-hidden />;
  }

  if (!user) {
    return (
      <Link href="/login" className={styles.loginLink}>
        Sign in
      </Link>
    );
  }

  const label =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Account";
  const avatarUrl = googleAvatarUrl(user);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={22}
            height={22}
            className={styles.triggerAvatar}
            unoptimized
            referrerPolicy="no-referrer"
          />
        ) : null}
        <span className={styles.name} title={user.email ?? undefined}>
          {label}
        </span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div id={menuId} className={styles.dropdown} aria-label="Account">
          <div className={styles.section}>
            <Link
              href="/account"
              className={styles.menuLink}
              onClick={() => setOpen(false)}
            >
              Account
            </Link>
            <Link
              href="/account/preferences"
              className={styles.menuLink}
              onClick={() => setOpen(false)}
            >
              Preferences
            </Link>
            <Link
              href="/account/integrations"
              className={styles.menuLink}
              onClick={() => setOpen(false)}
            >
              Integrations
            </Link>
            <Link
              href="/history"
              className={styles.menuLink}
              onClick={() => setOpen(false)}
            >
              History
            </Link>
            <Link
              href="/ignored"
              className={styles.menuLink}
              onClick={() => setOpen(false)}
            >
              Ignored games
            </Link>
          </div>
          <div className={styles.divider} />
          <div className={styles.section}>
            <CustomCursorToggle />
            {steam.ready ? (
              <PreferenceToggle
                label="Open in Steam"
                checked={steam.openInSteam}
                onChange={steam.setOpenInSteam}
              />
            ) : null}
          </div>
          <div className={styles.divider} />
          <button
            type="button"
            onClick={() => void signOut()}
            className={styles.signOut}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
