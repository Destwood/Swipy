import { DeckPreviewClient } from "@/features/session/components/DeckPreviewClient";

/** Solo infinite-mode swipe. Deck solo preview lives at /deck. */
export default function InfinitePage() {
  return <DeckPreviewClient mode="infinite" />;
}
