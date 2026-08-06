export type SessionStatus = "lobby" | "swiping" | "finished";
export type MatchRule = "all" | "majority" | "half";
export type MemberStatus = "waiting" | "ready" | "swiping" | "done";
export type VoteValue = "like" | "dislike";

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          code: string;
          deck_id: string;
          status: SessionStatus;
          match_rule: MatchRule;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          deck_id: string;
          status?: SessionStatus;
          match_rule?: MatchRule;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          deck_id?: string;
          status?: SessionStatus;
          match_rule?: MatchRule;
          created_at?: string;
        };
        Relationships: [];
      };
      session_members: {
        Row: {
          id: string;
          session_id: string;
          display_name: string;
          guest_token: string;
          is_host: boolean;
          status: MemberStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          display_name: string;
          guest_token: string;
          is_host?: boolean;
          status?: MemberStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          display_name?: string;
          guest_token?: string;
          is_host?: boolean;
          status?: MemberStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          session_id: string;
          member_id: string;
          game_id: string;
          value: VoteValue;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          member_id: string;
          game_id: string;
          value: VoteValue;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          member_id?: string;
          game_id?: string;
          value?: VoteValue;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
