"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GenreTag } from "@/features/games/components/GenreTag";
import type { Game } from "@/features/games/data/games";
import { HERO_IMG, SAMPLE_LIKED } from "@/features/games/data/games";
import { getLibraryGameById } from "@/features/games/lib/game-library";
import type { SessionMember } from "@/features/session/data/session";
import { getActiveSession, toUiMember } from "@/features/session/lib/session-context";
import { fetchMembers } from "@/features/session/lib/sessions";
import styles from "./page.module.css";

const RESULT_GAME_KEY = "swipy.resultGameId";

export default function SessionResultPage() {
  const [game, setGame] = useState<Game | null>(SAMPLE_LIKED[0] ?? null);
  const [members, setMembers] = useState<SessionMember[]>([]);

  useEffect(() => {
    const id = sessionStorage.getItem(RESULT_GAME_KEY);
    const picked = id ? getLibraryGameById(id) : undefined;
    if (picked) setGame(picked);

    const active = getActiveSession();
    if (!active) return;
    void fetchMembers(active.sessionId)
      .then((rows) => setMembers(rows.map(toUiMember)))
      .catch(() => undefined);
  }, []);

  if (!game) {
    return (
      <div className={styles.root}>
        <AppTopBar />
        <div className={styles.content}>
          <p className={styles.eyebrow}>Tonight we play</p>
          <h1 className={styles.title}>No game picked yet</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Image
        src={HERO_IMG}
        alt=""
        aria-hidden
        fill
        className={styles.heroImage}
        sizes="100vw"
      />
      <div aria-hidden className={styles.radialOverlay} />

      <AppTopBar />

      <div className={styles.content}>
        <p className={styles.eyebrow}>Tonight we play</p>

        <div className={styles.gameCard}>
          <div className={styles.cover}>
            <Image
              src={game.image}
              alt={`${game.title} cover`}
              fill
              className={styles.coverImage}
              sizes="112px"
              priority
            />
          </div>
          <div className={styles.gameMeta}>
            <h1 className={styles.gameTitle}>{game.title}</h1>
            <p className={styles.gameDetails}>
              {game.developer} · {game.year}
            </p>
            <div className={styles.genres}>
              {game.genres.map((g, i) => (
                <GenreTag key={g} label={g} accent={i === 0} />
              ))}
            </div>
            <p className={styles.matchNote}>
              Matched by {members.length || "your"} friends
            </p>
          </div>
        </div>

        <div className={styles.avatars}>
          {members.map((m) => (
            <div
              key={m.id}
              title={m.name}
              className={styles.avatar}
              style={{ background: m.color }}
            >
              {m.initials}
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Link href="/session/matches" className={styles.secondaryLink}>
            Back to matches
          </Link>
          <Link href="/" className={styles.primaryLink}>
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}
