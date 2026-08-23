import { NextResponse } from "next/server";
import type { SteamMedia, SteamMediaMovie } from "@/features/games/lib/steam-media";

type SteamAppDetails = {
  success?: boolean;
  data?: {
    short_description?: string;
    screenshots?: { path_thumbnail?: string; path_full?: string }[];
    movies?: {
      name?: string;
      thumbnail?: string;
      mp4?: { "480"?: string; max?: string };
      webm?: { "480"?: string; max?: string };
    }[];
  };
};

function httpsUrl(url?: string): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, "https://");
}

export async function GET(request: Request) {
  const appId = new URL(request.url).searchParams.get("appId")?.trim() ?? "";
  if (!/^\d+$/.test(appId)) {
    return NextResponse.json({ error: "Invalid appId" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`,
      { next: { revalidate: 21600 } },
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Steam unavailable" }, { status: 502 });
    }

    const raw = (await res.json()) as Record<string, SteamAppDetails>;
    const payload = raw[appId];
    if (!payload?.success || !payload.data) {
      return NextResponse.json({
        about: undefined,
        screenshots: [],
        movies: [],
      } satisfies SteamMedia);
    }

    const screenshots = (payload.data.screenshots ?? [])
      .map((s) => {
        const full = httpsUrl(s.path_full);
        const thumb = httpsUrl(s.path_thumbnail) ?? full;
        if (!full || !thumb) return null;
        return { thumb, full };
      })
      .filter((s): s is { thumb: string; full: string } => Boolean(s))
      .slice(0, 6);

    const movies = (payload.data.movies ?? [])
      .map((m) => {
        const mp4 = httpsUrl(m.mp4?.max ?? m.mp4?.["480"] ?? m.webm?.max);
        const thumbnail = httpsUrl(m.thumbnail);
        if (!mp4 || !thumbnail) return null;
        return { name: m.name ?? "Trailer", thumbnail, mp4 };
      })
      .filter((m): m is SteamMediaMovie => Boolean(m))
      .slice(0, 3);

    const body: SteamMedia = {
      about: payload.data.short_description?.trim() || undefined,
      screenshots,
      movies,
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Steam request failed" }, { status: 502 });
  }
}
