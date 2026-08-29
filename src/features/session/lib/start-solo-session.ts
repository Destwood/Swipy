import { setActiveDeckId } from "@/features/decks/lib/deck-store";
import { displayNameFromCurrentUser } from "@/features/session/lib/display-names";
import {
  createGuestSession,
  startSessionSwiping,
} from "@/features/session/lib/sessions";

export async function startSoloSession(deckId: string) {
  setActiveDeckId(deckId);
  const displayName = (await displayNameFromCurrentUser()) ?? "You";
  const session = await createGuestSession({
    deckId,
    displayName,
  });
  await startSessionSwiping(session.sessionId);
  return session;
}
