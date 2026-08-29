import { DeckPreviewClient } from "@/features/session/components/DeckPreviewClient";

/** Solo infinite-mode swipe stub. Session votes still go through /session/deck. */
export default function InfinitePage() {
  return <DeckPreviewClient mode="infinite" />;
}
