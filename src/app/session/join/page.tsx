import { AppTopBar } from "@/components/AppTopBar";
import { JoinSessionForm } from "@/components/JoinSessionForm";

export default function SessionJoinPage() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-sw-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 35%, rgba(45,212,191,0.05) 0%, transparent 70%)",
        }}
      />
      <AppTopBar />
      <JoinSessionForm />
    </div>
  );
}
