export interface Game {
  id: string;
  title: string;
  developer: string;
  year: number;
  genres: string[];
  description: string;
  image: string;
  metacritic?: number;
}

/** Hardcoded game catalog — source of truth until a real DB exists. */
export const GAMES: Game[] = [
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    developer: "Team Cherry",
    year: 2017,
    genres: ["Metroidvania", "Platformer", "Indie"],
    description:
      "Explore the sprawling underground kingdom of Hallownest — a place of mystery, danger, and ancient secrets.",
    image:
      "https://images.unsplash.com/photo-1517239320384-e08ad2c24a3e?w=600&h=820&fit=crop&auto=format",
    metacritic: 90,
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    developer: "FromSoftware",
    year: 2022,
    genres: ["Action RPG", "Open World"],
    description:
      "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord.",
    image:
      "https://images.unsplash.com/photo-1684837681040-bf2a1653de60?w=600&h=820&fit=crop&auto=format",
    metacritic: 96,
  },
  {
    id: "disco-elysium",
    title: "Disco Elysium",
    developer: "ZA/UM",
    year: 2019,
    genres: ["RPG", "Detective", "Narrative"],
    description:
      "A groundbreaking open world RPG where the skills in your head argue back and the city has a million stories.",
    image:
      "https://images.unsplash.com/photo-1541702467897-41915a07d3a7?w=600&h=820&fit=crop&auto=format",
    metacritic: 91,
  },
  {
    id: "hades",
    title: "Hades",
    developer: "Supergiant Games",
    year: 2020,
    genres: ["Roguelite", "Action", "Indie"],
    description:
      "Defy the god of the Dead as you hack and slash your way out of the Underworld in this rogue-like dungeon crawler.",
    image:
      "https://images.unsplash.com/photo-1643301786048-fa5d1c1e5ab4?w=600&h=820&fit=crop&auto=format",
    metacritic: 93,
  },
  {
    id: "celeste",
    title: "Celeste",
    developer: "Maddy Thorson",
    year: 2018,
    genres: ["Platformer", "Indie", "Narrative"],
    description:
      "Help Madeline survive her inner demons on her journey to the top of Celeste Mountain. A tight precision platformer.",
    image:
      "https://images.unsplash.com/photo-1496619465405-721b2b66a868?w=600&h=820&fit=crop&auto=format",
    metacritic: 94,
  },
  {
    id: "witcher-3",
    title: "The Witcher 3",
    developer: "CD Projekt Red",
    year: 2015,
    genres: ["RPG", "Open World", "Fantasy"],
    description:
      "Play as Geralt of Rivia, a hired sword, in a morally complex world where every choice has consequences.",
    image:
      "https://images.unsplash.com/photo-1728339097250-bf673536786f?w=600&h=820&fit=crop&auto=format",
    metacritic: 92,
  },
  {
    id: "god-of-war",
    title: "God of War: Ragnarök",
    developer: "Santa Monica Studio",
    year: 2022,
    genres: ["Action", "Adventure", "Narrative"],
    description:
      "Kratos and Atreus must journey to each of the Nine Realms as Fimbulwinter closes in around them.",
    image:
      "https://images.unsplash.com/photo-1670702146868-bc7797ef47a5?w=600&h=820&fit=crop&auto=format",
    metacritic: 94,
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk 2077",
    developer: "CD Projekt Red",
    year: 2020,
    genres: ["RPG", "Open World", "Shooter"],
    description:
      "Live and breathe Night City — a megalopolis obsessed with power, glamour, and body modification. Make your legend.",
    image:
      "https://images.unsplash.com/photo-1672872476232-da16b45c9001?w=600&h=820&fit=crop&auto=format",
    metacritic: 86,
  },
  {
    id: "dead-cells",
    title: "Dead Cells",
    developer: "Motion Twin",
    year: 2018,
    genres: ["Roguelite", "Metroidvania", "Action"],
    description:
      "A rogue-lite Castlevania-inspired action platformer. Kill. Die. Learn. Repeat. The castle always changes.",
    image:
      "https://images.unsplash.com/photo-1642084117539-29c8ab773d85?w=600&h=820&fit=crop&auto=format",
    metacritic: 89,
  },
  {
    id: "outer-wilds",
    title: "Outer Wilds",
    developer: "Mobius Digital",
    year: 2019,
    genres: ["Adventure", "Exploration", "Mystery"],
    description:
      "Explore a handcrafted mystery about a solar system trapped in an endless time loop — and the end of time itself.",
    image:
      "https://images.unsplash.com/photo-1505506874110-6a7a69069a08?w=600&h=820&fit=crop&auto=format",
    metacritic: 85,
  },
  {
    id: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    developer: "Larian Studios",
    year: 2023,
    genres: ["RPG", "Strategy", "Fantasy"],
    description:
      "Gather your party and return to the Forgotten Realms. An epic D&D adventure with staggering depth and freedom.",
    image:
      "https://images.unsplash.com/photo-1637166185518-058f5896a2e9?w=600&h=820&fit=crop&auto=format",
    metacritic: 96,
  },
  {
    id: "stardew-valley",
    title: "Stardew Valley",
    developer: "ConcernedApe",
    year: 2016,
    genres: ["Simulation", "RPG", "Indie"],
    description:
      "Trade the cubicle for open skies and fertile land. Build the farming life you always wanted in Pelican Town.",
    image:
      "https://images.unsplash.com/photo-1638057733961-591fa542f718?w=600&h=820&fit=crop&auto=format",
    metacritic: 89,
  },
];

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGamesByIds(ids: string[]): Game[] {
  return ids
    .map((id) => getGameById(id))
    .filter((g): g is Game => g !== undefined);
}

/** Static sample for Liked page layout. */
export const SAMPLE_LIKED = GAMES.slice(0, 4);

export const HERO_IMG =
  "https://images.unsplash.com/photo-1773615098146-2341d1b72997?w=1600&h=1000&fit=crop&auto=format";
