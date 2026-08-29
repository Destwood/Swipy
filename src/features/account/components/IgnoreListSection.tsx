"use client";

import Link from "next/link";
import { FilterChip } from "@/shared/ui/FilterChip";
import {
  IGNORE_GENRE_OPTIONS,
  IGNORE_PLATFORM_OPTIONS,
} from "@/features/games/lib/ignore-list";
import { useIgnoreList } from "@/features/games/lib/use-ignore-list";
import styles from "./IgnoreListSection.module.css";

export function IgnoreListSection() {
  const ignore = useIgnoreList();

  return (
    <div className={styles.root}>
      <p className={styles.hint}>
        Add genres or platforms you want hidden. A genre hides any game that
        includes it — ignore Platform and you will not see platformers. A
        platform hides titles exclusive to it: ignore PlayStation and a PC + PS
        game still appears; a PS-only game does not.
      </p>
      <Link href="/ignored" className={styles.gamesLink}>
        Ignored games
      </Link>

      <p className={styles.groupLabel}>Genres</p>
      <div className={styles.chips}>
        {IGNORE_GENRE_OPTIONS.map((genre) => (
          <FilterChip
            key={genre}
            tone="danger"
            active={ignore.genres.includes(genre)}
            onClick={() => ignore.toggleGenre(genre)}
          >
            {genre}
          </FilterChip>
        ))}
      </div>

      <p className={styles.groupLabel}>Platforms</p>
      <div className={styles.chips}>
        {IGNORE_PLATFORM_OPTIONS.map((platform) => (
          <FilterChip
            key={platform}
            tone="danger"
            active={ignore.platforms.includes(platform)}
            onClick={() => ignore.togglePlatform(platform)}
          >
            {platform}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
