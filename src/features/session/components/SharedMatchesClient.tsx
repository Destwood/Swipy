"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GenreTag } from "@/features/games/components/GenreTag";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import type { Game } from "@/features/games/data/games";
import {
  ensureSeedLibrary,
  getLibraryGameById,
  upsertGames,
} from "@/features/games/lib/game-library";
import { steamStoreAppUrl } from "@/features/games/lib/steam";
import {
  decodeShareMatchesToken,
  formatShareExpiry,
  isShareMatchesExpired,
  type ShareMatchesPayload,
} from "@/features/session/lib/share-matches";
import styles from "@/features/session/components/SessionMatchesClient.module.css";

export function SharedMatchesClient() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<ShareMatchesPayload | null>(null);
  const [matches, setMatches] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = searchParams.get("d")?.trim() ?? "";
      if (!token) {
        setError("Missing share link data.");
        setReady(true);
        return;
      }

      const decoded = decodeShareMatchesToken(token);
      if (!decoded) {
        setError("This share link is invalid.");
        setReady(true);
        return;
      }
      if (isShareMatchesExpired(decoded)) {
        setError("This share link has expired (links last 7 days).");
        setPayload(decoded);
        setReady(true);
        return;
      }

      ensureSeedLibrary();
      let games = decoded.ids
        .map((id) => getLibraryGameById(id))
        .filter((g): g is Game => Boolean(g));

      const missing = decoded.ids.filter((id) => !getLibraryGameById(id));
      const igdbIds = missing
        .map((id) => id.replace(/^igdb-/, ""))
        .filter((id) => /^\d+$/.test(id));
      if (igdbIds.length > 0) {
        try {
          const res = await fetch(
            `/api/games/by-ids?ids=${encodeURIComponent(igdbIds.join(","))}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { results?: Game[] };
            if (data.results?.length) {
              upsertGames(data.results);
              games = decoded.ids
                .map((id) => getLibraryGameById(id))
                .filter((g): g is Game => Boolean(g));
            }
          }
        } catch {
          /* keep whatever we have locally */
        }
      }

      if (cancelled) return;
      setPayload(decoded);
      setMatches(games);
      if (games.length === 0) {
        setError("Could not load games for this share link.");
      }
      setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function openSteam(game: Game) {
    if (game.steamAppId) {
      window.location.href = steamStoreAppUrl(game.steamAppId);
    }
  }

  if (!ready) {
    return <div className={styles.loading}>Loading shared matches…</div>;
  }

  return (
    <div className={styles.root}>
      <AppTopBar>
        <div className={styles.topBarLeft}>
          <SwipyLogo size="bar" href="/" />
        </div>
      </AppTopBar>

      <div className={styles.scroll}>
        <div className={styles.page}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Shared results</p>
            <h1 className={styles.title}>Matches</h1>
            <p className={styles.subtitle}>
              {payload && !isShareMatchesExpired(payload)
                ? `Snapshot from a Swipy session · link valid until ${formatShareExpiry(payload.exp)}`
                : "A shared match list from Swipy."}
            </p>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          {matches.length > 0 ? (
            <ul className={styles.list}>
              {matches.map((game, index) => (
                <li key={game.id} className={styles.row}>
                  <span className={styles.rank}>{index + 1}</span>
                  <div className={styles.thumbnail}>
                    <Image
                      src={game.image}
                      alt={`${game.title} cover`}
                      fill
                      className={styles.cover}
                      sizes="72px"
                      unoptimized={
                        game.image.includes("igdb") || game.image.includes("rawg")
                      }
                    />
                  </div>
                  <div className={styles.content}>
                    <div className={styles.gameTitle}>{game.title}</div>
                    <div className={styles.metaRow}>
                      {game.genres.slice(0, 2).map((g, i) => (
                        <GenreTag key={g} label={g} accent={i === 0} />
                      ))}
                      {payload ? (
                        <span className={styles.likeCount}>
                          {payload.likes[game.id] ?? 0}/{payload.members} liked
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {game.steamAppId ? (
                    <button
                      type="button"
                      onClick={() => openSteam(game)}
                      className={styles.playLink}
                    >
                      Play this
                    </button>
                  ) : (
                    <span className={styles.noSteam}>No Steam</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.footer}>
            <Link href="/decks" className={styles.continueLink}>
              Browse decks
            </Link>
            <Link href="/" className={styles.keepSwipingLink}>
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
