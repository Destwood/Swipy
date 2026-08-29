"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { MatchResultsPageSkeleton } from "@/features/session/components/skeletons/MatchResultsPageSkeleton";
import type { Game } from "@/features/games/data/games";
import {
  ensureSeedLibrary,
  getLibraryGameById,
  upsertGames,
} from "@/features/games/lib/game-library";
import { MatchGameRow } from "@/features/session/components/MatchGameRow";
import {
  buildAgreementSections,
  type AgreementSection,
} from "@/features/session/lib/match-results";
import {
  decodeShareMatchesToken,
  formatShareExpiry,
  isShareMatchesExpired,
  type ShareMatchesPayload,
} from "@/features/session/lib/share-matches";
import { Button, ButtonVariant } from "@/shared/ui/Button";
import styles from "@/features/session/components/SessionMatchesClient.module.css";

export function SharedMatchesClient() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<ShareMatchesPayload | null>(null);
  const [sections, setSections] = useState<AgreementSection[]>([]);
  const [soloGames, setSoloGames] = useState<Game[]>([]);
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

      const isSolo = decoded.members <= 1;
      if (isSolo) {
        setSoloGames(games);
        setSections([]);
      } else {
        const likes: Record<string, number> = {};
        for (const game of games) {
          likes[game.id] = decoded.likes[game.id] ?? 0;
        }
        setSections(buildAgreementSections(likes, decoded.members));
        setSoloGames([]);
      }

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

  if (!ready) {
    return (
      <MatchResultsPageSkeleton
        eyebrow="Shared results"
        title="Matches"
        subtitle="Loading shared session snapshot…"
      />
    );
  }

  const isSolo = (payload?.members ?? 0) <= 1;
  const hasGames =
    soloGames.length > 0 || sections.some((s) => s.games.length > 0);

  return (
    <div className={styles.root}>
      <AppTopBar />

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

          {isSolo && soloGames.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Liked</h2>
                <span className={styles.sectionMeta}>
                  {soloGames.length}{" "}
                  {soloGames.length === 1 ? "game" : "games"}
                </span>
              </div>
              <ul className={styles.heroList}>
                {soloGames.map((game, index) => (
                  <MatchGameRow
                    key={game.id}
                    game={game}
                    rank={index + 1}
                    variant="hero"
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {!isSolo
            ? sections.map((section, sectionIndex) => (
                <section key={section.tier.key} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{section.tier.label}</h2>
                    <span className={styles.sectionMeta}>
                      {section.games.length}{" "}
                      {section.games.length === 1 ? "game" : "games"}
                    </span>
                  </div>
                  <ul
                    className={
                      sectionIndex === 0 ? styles.heroList : styles.list
                    }
                  >
                    {section.games.map((ranked, index) => (
                      <MatchGameRow
                        key={ranked.game.id}
                        game={ranked.game}
                        rank={index + 1}
                        variant={sectionIndex === 0 ? "hero" : "compact"}
                        voteMeta={
                          <span className={styles.likeCount}>
                            {ranked.likes}/{ranked.members} liked
                          </span>
                        }
                      />
                    ))}
                  </ul>
                </section>
              ))
            : null}

          {!hasGames && !error ? (
            <p className={styles.empty}>No games in this share link.</p>
          ) : null}

          <div className={styles.footer}>
            <Button href="/decks" variant={ButtonVariant.Accent}>
              Browse decks
            </Button>
            <Button href="/" variant={ButtonVariant.Dark}>
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
