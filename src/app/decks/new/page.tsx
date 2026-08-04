import { AppTopBar } from "@/components/AppTopBar";
import { CreateDeckForm } from "@/components/CreateDeckForm";

export default function NewDeckPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-sw-bg">
      <AppTopBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CreateDeckForm />
      </div>
    </div>
  );
}
