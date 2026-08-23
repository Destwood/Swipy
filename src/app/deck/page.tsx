import { DeckPreviewClient } from "@/features/session/components/DeckPreviewClient";

/** Local practice swipe — live votes still go through /session/deck. */
export default function DeckPage() {
  return <DeckPreviewClient />;
}
