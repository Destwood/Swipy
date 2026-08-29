"use client";

import { useEffect, useState } from "react";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { MatchResultsPageSkeleton } from "@/features/session/components/skeletons/MatchResultsPageSkeleton";
import type { Game } from "@/features/games/data/games";
import { openSteamStore } from "@/features/games/lib/steam";
import { MatchGameRow } from "@/features/session/components/MatchGameRow";
import { ResultsPageToolbar } from "@/features/session/components/ResultsPageToolbar";
import { VoteBreakdown } from "@/features/session/components/VoteBreakdown";
import { getActiveSession, toUiMember } from "@/features/session/lib/session-context";
import {
  buildAgreementSections,
  countLikesByGame,
  flattenAgreementGames,
  gamesLikedByMember,
  gamesRejectedByMember,
  type AgreementSection,
  type RankedGame,
} from "@/features/session/lib/match-results";
import {
  buildShareMatchesPayload,
  buildShareMatchesUrl,
  encodeShareMatchesToken,
  formatShareExpiry,
} from "@/features/session/lib/share-matches";
import { fetchMembers, fetchVotes } from "@/features/session/lib/sessions";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import { PageBackLink } from "@/shared/ui/PageBackLink";
import { toast } from "@/shared/ui/toast";
import styles from "./SessionMatchesClient.module.css";

const RESULT_GAME_KEY = "swipy.resultGameId";

export function SessionMatchesClient() {
  const [isSolo, setIsSolo] = useState(false);
  const [liked, setLiked] = useState<Game[]>([]);
  const [sections, setSections] = useState<AgreementSection[]>([]);
  const [rejected, setRejected] = useState<Game[]>([]);
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

      const [members, votes] = await Promise.all([
        fetchMembers(active.sessionId),
        fetchVotes(active.sessionId),
      ]);

      const counts = countLikesByGame(votes);
      const solo = members.length <= 1;
      setIsSolo(solo);
      setLikeCounts(counts);
      setMemberCount(members.length);

      if (solo) {
        const myLiked = gamesLikedByMember(votes, active.memberId);
        const myRejected = gamesRejectedByMember(votes, active.memberId);
        setLiked(myLiked);
        setRejected(myRejected);
        setSections([]);
      } else {
        const agreement = buildAgreementSections(counts, members.length, {
          members: members.map(toUiMember),
          votes,
        });
        const inAgreement = new Set(
          flattenAgreementGames(agreement).map((g) => g.id),
        );
        setSections(agreement);
        setLiked([]);
        setRejected(
          gamesRejectedByMember(votes, active.memberId, inAgreement),
        );
      }

      setReady(true);
    }

    void load().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load matches");
      setReady(true);
    });
  }, []);

  const shareGames = isSolo ? liked : flattenAgreementGames(sections);
  const topPick = shareGames[0] ?? rejected[0] ?? null;

  function pickGame(gameId: string) {
    sessionStorage.setItem(RESULT_GAME_KEY, gameId);
  }

  async function shareResults() {
    if (shareGames.length === 0 || shareBusy) return;
    setShareBusy(true);
    setShareHint(null);
    try {
      const payload = buildShareMatchesPayload({
        matches: shareGames,
        likeCounts,
        memberCount,
      });
      const token = encodeShareMatchesToken(payload);
      const url = buildShareMatchesUrl(window.location.origin, token);
      await navigator.clipboard.writeText(url);
      toast("Link copied");
      setShareHint(`Valid until ${formatShareExpiry(payload.exp)}`);
    } catch {
      setShareHint("Could not copy link. Check clipboard permissions.");
    } finally {
      setShareBusy(false);
    }
  }

  function pickAction(game: Game) {
    if (game.steamAppId) {
      return (
        <Button
          type="button"
          onClick={() => {
            openSteamStore(game.steamAppId!);
          }}
          variant={ButtonVariant.Soft}
          size={ButtonSize.Sm}
        >
          Play this
        </Button>
      );
    }
    return (
      <Button
        href="/session/result"
        onClick={() => pickGame(game.id)}
        variant={ButtonVariant.Soft}
        size={ButtonSize.Sm}
      >
        Pick
      </Button>
    );
  }

  function renderRankedList(
    games: RankedGame[],
    showStats: boolean,
    variant: "compact" | "hero" = "compact",
  ) {
    return (
      <ul className={variant === "hero" ? styles.heroList : styles.list}>
        {games.map((ranked, index) => (
          <MatchGameRow
            key={ranked.game.id}
            game={ranked.game}
            rank={index + 1}
            variant={variant}
            voteMeta={
              showStats ? (
                <VoteBreakdown
                  voters={ranked.voters}
                  likes={ranked.likes}
                  members={ranked.members}
                />
              ) : null
            }
            action={variant === "hero" ? null : pickAction(ranked.game)}
          />
        ))}
      </ul>
    );
  }

  function renderGameList(
    games: Game[],
    showRank = true,
    variant: "compact" | "hero" = "compact",
    priceAlign: "foot" | "center" = "foot",
  ) {
    return (
      <ul className={variant === "hero" ? styles.heroList : styles.list}>
        {games.map((game, index) => (
          <MatchGameRow
            key={game.id}
            game={game}
            rank={showRank ? index + 1 : undefined}
            variant={variant}
            priceAlign={variant === "compact" ? priceAlign : "foot"}
            action={variant === "hero" ? null : pickAction(game)}
          />
        ))}
      </ul>
    );
  }

  if (!ready) {
    return (
      <MatchResultsPageSkeleton
        backHref="/session/deck"
        backLabel="← Deck"
        eyebrow="Your list"
        title="Results"
        subtitle="Games you liked or skipped. Open Steam from the cover or title."
      />
    );
  }

  const hasAny =
    liked.length > 0 || sections.length > 0 || rejected.length > 0;

  return (
    <div className={styles.root}>
      <AppTopBar />

      <div className={styles.scroll}>
        <div className={styles.page}>
          <PageBackLink href="/session/deck">← Deck</PageBackLink>
          <div className={styles.headerRow}>
            <div className={styles.headerMain}>
              <p className={styles.eyebrow}>
                {isSolo ? "Your list" : "Shared list"}
              </p>
              <h1 className={styles.title}>{isSolo ? "Results" : "Matches"}</h1>
              <p className={styles.subtitle}>
                {isSolo
                  ? "Games you liked or skipped. Open Steam from the cover or title."
                  : "Agreement by how many people liked each game. Open Steam or share the list."}
              </p>
            </div>
            {shareGames.length > 0 ? (
              <ResultsPageToolbar
                onCopyLink={() => void shareResults()}
                menuItems={[
                  ...(topPick
                    ? [
                        {
                          label: "Continue to result",
                          href: "/session/result",
                          onClick: () => pickGame(topPick.id),
                        },
                      ]
                    : []),
                ]}
              />
            ) : null}
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {shareHint ? <p className={styles.shareHint}>{shareHint}</p> : null}

          {!hasAny ? (
            <p className={styles.empty}>
              {isSolo
                ? "No votes yet. Keep swiping."
                : "No matches yet. Keep swiping or wait for friends to finish."}
            </p>
          ) : null}

          {isSolo && liked.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Liked</h2>
                <span className={styles.sectionMeta}>
                  {liked.length} {liked.length === 1 ? "game" : "games"}
                </span>
              </div>
              {renderGameList(liked, true, "hero")}
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
                  {renderRankedList(
                    section.games,
                    true,
                    sectionIndex === 0 ? "hero" : "compact",
                  )}
                </section>
              ))
            : null}

          {rejected.length > 0 ? (
            <section className={`${styles.section} ${styles.sectionRejected}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Rejected</h2>
                <span className={styles.sectionMeta}>
                  {rejected.length} {rejected.length === 1 ? "game" : "games"}
                </span>
              </div>
              {renderGameList(rejected, true, "compact", "center")}
            </section>
          ) : null}

          <div className={styles.footer}>
            {topPick && (
              <Button
                href="/session/result"
                onClick={() => pickGame(topPick.id)}
                variant={ButtonVariant.Accent}
              >
                Continue to result
              </Button>
            )}
            <Button href="/session/deck" variant={ButtonVariant.Dark}>
              Keep swiping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
