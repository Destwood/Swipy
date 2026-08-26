"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AppTopBar } from "@/features/shell/components/AppTopBar";
import { GenreTag } from "@/features/games/components/GenreTag";
import type { Game } from "@/features/games/data/games";
import { HERO_IMG } from "@/features/games/data/games";
import { getLibraryGameById } from "@/features/games/lib/game-library";
import type { SessionMember } from "@/features/session/data/session";
import {
  getActiveSession,
  toUiMember,
} from "@/features/session/lib/session-context";
import { fetchMembers } from "@/features/session/lib/sessions";
import { Button, ButtonVariant } from "@/shared/ui/Button";
import styles from "./page.module.css";

const RESULT_GAME_KEY = "swipy.resultGameId";

export default function SessionResultPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem(RESULT_GAME_KEY);
    const picked = id ? getLibraryGameById(id) : undefined;
    if (picked) setGame(picked);

    const active = getActiveSession();
    if (!active) {
      setReady(true);
      return;
    }
    void fetchMembers(active.sessionId)
      .then((rows) => setMembers(rows.map(toUiMember)))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className={styles.root}>
        <AppTopBar />
        <div className={styles.content}>
          <p className={styles.eyebrow}>Tonight we play</p>
          <h1 className={styles.title}>Loading…</h1>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className={styles.root}>
        <AppTopBar />
        <div className={styles.content}>
          <p className={styles.eyebrow}>Tonight we play</p>
          <h1 className={styles.title}>No game picked yet</h1>
          <div className={styles.actions}>
            <Button href="/session/matches" variant={ButtonVariant.Accent}>
              Back to matches
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const bg = game.image || HERO_IMG;

  return (
    <div className={styles.root}>
      <Image
        src={bg}
        alt=""
        aria-hidden
        fill
        className={styles.heroImage}
        sizes="100vw"
        unoptimized={bg.includes("igdb") || bg.includes("rawg")}
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
              unoptimized={
                game.image.includes("igdb") || game.image.includes("rawg")
              }
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
              {members.length > 0
                ? `Matched with ${members.length} ${members.length === 1 ? "player" : "players"}`
                : "Picked from your matches"}
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
              <span className={styles.initials}>{m.initials}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Button href="/session/matches" variant={ButtonVariant.Dark}>
            Back to matches
          </Button>
          <Button href="/" variant={ButtonVariant.Accent}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
