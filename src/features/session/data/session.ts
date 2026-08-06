export interface SessionMember {
  id: string;
  name: string;
  initials: string;
  role: "host" | "member";
  status: "ready" | "waiting" | "swiping" | "done";
  color: string;
}

export const SAMPLE_MEMBERS: SessionMember[] = [
  {
    id: "you",
    name: "You",
    initials: "YO",
    role: "host",
    status: "ready",
    color: "#2dd4bf",
  },
  {
    id: "marta",
    name: "Marta",
    initials: "MA",
    role: "member",
    status: "ready",
    color: "#34d399",
  },
  {
    id: "oleh",
    name: "Oleh",
    initials: "OL",
    role: "member",
    status: "waiting",
    color: "#60a5fa",
  },
  {
    id: "ira",
    name: "Ira",
    initials: "IR",
    role: "member",
    status: "ready",
    color: "#f472b6",
  },
];

export const SAMPLE_SESSION_CODE = "SWPY-7K4M";
