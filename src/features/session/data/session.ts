export interface SessionMember {
  id: string;
  name: string;
  initials: string;
  role: "host" | "member";
  status: "ready" | "waiting" | "swiping" | "done";
  color: string;
  avatarUrl?: string | null;
}
