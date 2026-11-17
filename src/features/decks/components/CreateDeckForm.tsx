"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LibraryCard } from "@/app/library/LibraryCard";
import { LibraryCatalog } from "@/features/games/components/LibraryCatalog";
import type { Game } from "@/features/games/data/games";
import {
  ensureSeedLibrary,
  getLibraryGamesByIds,
  upsertGames,
  hydrateSeedGamesFromIgdb,
} from "@/features/games/lib/game-library";
import { saveCustomDeck, updateDeck, getDeckById } from "@/features/decks/lib/deck-store";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/Button";
import styles from "./CreateDeckForm.module.css";

type Props = {
  deckId?: string;
};

export function CreateDeckForm({ deckId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(deckId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<Record<string, Game>>({});
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!isEdit);

  useEffect(() => {
    ensureSeedLibrary();
    void hydrateSeedGamesFromIgdb();

    if (!deckId) return;

    let cancelled = false;
    void (async () => {
      const deck = await getDeckById(deckId);
      if (cancelled) return;
      if (!deck) {
        setError("Deck not found.");
        setReady(true);
        return;
      }
      setName(deck.name);
      setDescription(deck.description ?? "");
      setSelected(deck.gameIds);
      const games = getLibraryGamesByIds(deck.gameIds);
      const map: Record<string, Game> = {};
      for (const g of games) map[g.id] = g;
      setSelectedGames(map);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  function toggle(game: Game) {
    setSelected((prev) => {
      const on = prev.includes(game.id);
      if (on) {
        setSelectedGames((map) => {
          const next = { ...map };
          delete next[game.id];
          return next;
        });
        return prev.filter((x) => x !== game.id);
      }
      upsertGames([game]);
      setSelectedGames((map) => ({ ...map, [game.id]: game }));
      return [...prev, game.id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the deck a name.");
      return;
    }
    if (selected.length < 2) {
      setError("Pick at least 2 games.");
      return;
    }

    upsertGames(Object.values(selectedGames));
    try {
      if (deckId) {
        await updateDeck(deckId, { name, description, gameIds: selected });
        router.push(`/decks?updated=${deckId}`);
        return;
      }
      const deck = await saveCustomDeck({
        name,
        description,
        gameIds: selected,
      });
      router.push(`/decks?created=${deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the deck.");
    }
  }

  const selectedCount = selected.length;

  if (!ready) {
    return <p className={styles.apiHint}>Loading deck…</p>;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Link href="/decks" className={styles.backLink}>
              ← Decks
            </Link>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Deck name"
              className={styles.nameInput}
              aria-label="Deck name"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className={styles.descInput}
              aria-label="Description"
            />
          </div>
          <div className={styles.toolbarRight}>
            <span className={styles.selectedCount}>
              {selectedCount} selected
            </span>
            <Button type="submit" variant={ButtonVariant.Accent} size={ButtonSize.Sm}>
              {isEdit ? "Save changes" : "Save deck"}
            </Button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </form>
      <LibraryCatalog
        renderCard={(game, index) => (
          <LibraryCard
            game={game}
            priority={index < 8}
            selection={{
              selected: selected.includes(game.id),
              onToggle: () => toggle(game),
            }}
          />
        )}
      />
    </>
  );
}
