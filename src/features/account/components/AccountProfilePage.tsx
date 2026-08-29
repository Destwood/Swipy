"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/features/auth/lib/use-auth-user";
import { googleAvatarUrl } from "@/features/auth/lib/google-avatar";
import { AccountContentSkeleton } from "@/features/account/components/AccountContentSkeleton";
import { AccountShell } from "@/features/account/components/AccountShell";
import shell from "@/features/account/components/AccountShell.module.css";
import { createBrowserSupabaseClient } from "@/shared/supabase/client";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";

export function AccountProfilePage() {
  const { user, ready } = useAuthUser();
  const router = useRouter();

  if (!ready || !user) {
    return (
      <AccountShell title="Profile">
        <AccountContentSkeleton />
      </AccountShell>
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Account";
  const avatarUrl = googleAvatarUrl(user);
  const initial = displayName.slice(0, 1).toUpperCase();

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <AccountShell title="Profile">
      <section className={shell.panel}>
        <div className={shell.identity}>
          <div className={shell.avatar}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={64}
                height={64}
                className={shell.avatarImg}
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              initial
            )}
          </div>
          <div className={shell.identityText}>
            <p className={shell.displayName}>{displayName}</p>
            {user.email ? <p className={shell.email}>{user.email}</p> : null}
          </div>
        </div>

        <div className={shell.actions}>
          <Button href="/decks" variant={ButtonVariant.Soft} size={ButtonSize.Sm}>
            My decks
          </Button>
          <Button
            type="button"
            variant={ButtonVariant.Dark}
            size={ButtonSize.Sm}
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </section>
    </AccountShell>
  );
}
