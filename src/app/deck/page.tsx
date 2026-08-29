import { DeckPreviewClient } from "@/features/session/components/DeckPreviewClient";

/** Solo swipe of the active deck. Infinite catalog lives at /infinite. */
export default function DeckPage() {
  return <DeckPreviewClient mode="deck" />;
}
