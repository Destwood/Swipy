import { AppTopBar } from "@/components/AppTopBar";
import { CreateSessionForm } from "@/components/CreateSessionForm";

export default function SessionCreatePage() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-sw-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(45,212,191,0.06) 0%, transparent 70%)",
        }}
      />
      <AppTopBar />
      <CreateSessionForm />
    </div>
  );
}
