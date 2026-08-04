import { AppTopBar } from "@/components/AppTopBar";
import { DecksList } from "@/components/DecksList";

export default function DecksPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DecksList />
      </div>
    </div>
  );
}
