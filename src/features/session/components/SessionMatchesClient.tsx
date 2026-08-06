"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ChevronLeftIcon from "@/assets/icons/chevron-left.svg";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GenreTag } from "@/features/games/components/GenreTag";
import { SwipyLogo } from "@/features/shell/components/SwipyLogo";
import type { Game } from "@/features/games/data/games";
import { getLibraryGameById } from "@/features/games/lib/game-library";
import { steamStoreAppUrl } from "@/features/games/lib/steam";
import { getActiveSession } from "@/features/session/lib/session-context";
import {
  buildShareMatchesPayload,
  buildShareMatchesUrl,
  encodeShareMatchesToken,
  formatShareExpiry,
} from "@/features/session/lib/share-matches";
import {
  computeMatchGameIds,
  fetchMembers,
  fetchSession,
  fetchVotes,
} from "@/features/session/lib/sessions";
import styles from "./SessionMatchesClient.module.css";

const RESULT_GAME_KEY = "swipy.resultGameId";

export function SessionMatchesClient() {
  const [matches, setMatches] = useState<Game[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [memberCount, setMemberCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const active = getActiveSession();
      if (!active) {
        setError("No active session.");
        setReady(true);
        return;
      }

      const [session, members, votes] = await Promise.all([
        fetchSession(active.sessionId),
        fetchMembers(active.sessionId),
        fetchVotes(active.sessionId),
      ]);

      const counts: Record<string, number> = {};
      for (const vote of votes) {
        if (vote.value === "like") {
          counts[vote.game_id] = (counts[vote.game_id] ?? 0) + 1;
        }
      }

      const ids = computeMatchGameIds(votes, members.length, session.match_rule);
      setMatches(ids.map(getLibraryGameById).filter((g): g is Game => Boolean(g)));
      setLikeCounts(counts);
      setMemberCount(members.length);
      setReady(true);
    }

    void load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load matches");
      setReady(true);
    });
  }, []);

  function pickGame(gameId: string) {
    sessionStorage.setItem(RESULT_GAME_KEY, gameId);
  }

  function openSteam(game: Game) {
    if (!game.steamAppId) return;
    window.location.href = steamStoreAppUrl(game.steamAppId);
  }

  async function shareResults() {
    if (matches.length === 0 || shareBusy) return;
    setShareBusy(true);
    setShareHint(null);
    try {
      const payload = buildShareMatchesPayload({
        matches,
        likeCounts,
        memberCount,
      });
      const token = encodeShareMatchesToken(payload);
      const url = buildShareMatchesUrl(window.location.origin, token);
      await navigator.clipboard.writeText(url);
      setShareHint(`Link copied · valid until ${formatShareExpiry(payload.exp)}`);
    } catch {
      setShareHint("Could not copy link. Check clipboard permissions.");
    } finally {
      setShareBusy(false);
    }
  }

  if (!ready) {
    return <div className={styles.loading}>Computing matches…</div>;
  }

  return (
    <div className={styles.root}>
      <AppTopBar
        right={
          matches[0] ? (
            <Link
              href="/session/result"
              onClick={() => pickGame(matches[0].id)}
              className={styles.pickLink}
            >
              Pick a game
            </Link>
          ) : null
        }
      >
        <div className={styles.topBarLeft}>
          <Link href="/session/deck" className={styles.backLink}>
            <ChevronLeftIcon className={styles.backIcon} aria-hidden />
            Deck
          </Link>
          <div className={styles.divider} />
          <SwipyLogo size="bar" href="/" />
        </div>
      </AppTopBar>

      <div className={styles.scroll}>
        <div className={styles.page}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Shared list</p>
            <h1 className={styles.title}>Matches</h1>
            <p className={styles.subtitle}>
              Games liked by everyone in the session. Open Steam or share the list.
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {shareHint ? <p className={styles.shareHint}>{shareHint}</p> : null}

          {matches.length === 0 ? (
            <p className={styles.empty}>
              No full matches yet. Keep swiping or wait for friends to finish.
            </p>
          ) : (
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
                      <span className={styles.likeCount}>
                        {likeCounts[game.id] ?? 0}/{memberCount} liked
                      </span>
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
                    <Link
                      href="/session/result"
                      onClick={() => pickGame(game.id)}
                      className={styles.playLink}
                    >
                      Pick
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className={styles.footer}>
            {matches.length > 0 ? (
              <button
                type="button"
                onClick={() => void shareResults()}
                disabled={shareBusy}
                className={styles.shareButton}
              >
                {shareBusy ? "Copying…" : "Share with friends"}
              </button>
            ) : null}
            {matches[0] && (
              <Link
                href="/session/result"
                onClick={() => pickGame(matches[0].id)}
                className={styles.continueLink}
              >
                Continue to result
              </Link>
            )}
            <Link href="/session/deck" className={styles.keepSwipingLink}>
              Keep swiping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
