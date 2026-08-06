"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import styles from "./AuthMenu.module.css";

export function AuthMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

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

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
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

  return (
    <div className={styles.menu}>
      <span className={styles.name} title={user.email ?? undefined}>
        {label}
      </span>
      <button type="button" onClick={() => void signOut()} className={styles.signOut}>
        Sign out
      </button>
    </div>
  );
}
