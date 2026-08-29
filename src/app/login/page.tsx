import { Suspense } from "react";
import Link from "next/link";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import styles from "./page.module.css";

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className={styles.root}>
      <AppTopBar />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Account</p>
        <h1 className={styles.title}>Sign in to Swipy</h1>
        <p className={styles.subtitle}>
          Use Google to save decks, open your account later, and keep your library across
          devices.
        </p>

        {error ? (
          <p className={styles.error}>
            {error === "auth" ? "Sign-in failed. Try again." : error}
          </p>
        ) : null}

        <Suspense
          fallback={
            <button type="button" className={styles.signInFallback} disabled>
              Continue with Google
            </button>
          }
        >
          <GoogleSignInButton />
        </Suspense>

        <p className={styles.note}>
          Guest sessions still work without an account.{" "}
          <Link href="/session" className={styles.noteLink}>
            Play with friends →
          </Link>
        </p>
      </div>
    </div>
  );
}
