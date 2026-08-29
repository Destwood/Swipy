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
          deck_name: string | null;
          status: SessionStatus;
          match_rule: MatchRule;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          deck_id: string;
          deck_name?: string | null;
          status?: SessionStatus;
          match_rule?: MatchRule;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          deck_id?: string;
          deck_name?: string | null;
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
      decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deck_games: {
        Row: {
          deck_id: string;
          game_id: string;
          position: number;
        };
        Insert: {
          deck_id: string;
          game_id: string;
          position?: number;
        };
        Update: {
          deck_id?: string;
          game_id?: string;
          position?: number;
        };
        Relationships: [];
      };
      ignored_games: {
        Row: {
          user_id: string;
          game_id: string;
          created_at: string;
        };
        Insert: {
          user_id?: string;
          game_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          game_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      session_games: {
        Row: {
          session_id: string;
          game_id: string;
          position: number;
        };
        Insert: {
          session_id: string;
          game_id: string;
          position?: number;
        };
        Update: {
          session_id?: string;
          game_id?: string;
          position?: number;
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
