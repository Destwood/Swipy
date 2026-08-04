import type { SessionMember } from "@/data/session";

const STATUS_LABEL: Record<SessionMember["status"], string> = {
  ready: "Ready",
  waiting: "Joining…",
  swiping: "Swiping",
  done: "Done",
};

export function MemberRow({ member }: { member: SessionMember }) {
  return (
    <li className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.035]">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-sw-bg"
        style={{ background: member.color }}
      >
        {member.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-base font-bold tracking-[-0.02em] text-sw-text">
            {member.name}
          </span>
          {member.role === "host" && (
            <span className="rounded-md border border-[rgba(45,212,191,0.28)] bg-sw-accent-d px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-sw-accent uppercase">
              Host
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-white/30">
          {STATUS_LABEL[member.status]}
        </span>
      </div>
      <span
        className={`h-2 w-2 rounded-full ${
          member.status === "waiting" ? "bg-white/25" : "bg-sw-accent"
        }`}
        aria-hidden
      />
    </li>
  );
}
