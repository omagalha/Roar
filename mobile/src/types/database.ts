export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type GoalPayload = {
  side: 'home' | 'away'
  goal_number: number
  league: string | null
  score: { home: number; away: number }
  teams: { home: string; away: string }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          team_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          team_id?: string | null
          created_at?: string
        }
        Update: {
          username?: string
          avatar_url?: string | null
          team_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          name: string
          country: string
          badge_url: string | null
        }
        Insert: {
          id?: string
          name: string
          country: string
          badge_url?: string | null
        }
        Update: {
          name?: string
          country?: string
          badge_url?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          external_fixture_id: number
          home_team_id: string
          away_team_id: string
          starts_at: string
          status: 'NS' | 'LIVE' | 'HT' | 'FT' | 'PST' | 'CANC'
          home_goals: number
          away_goals: number
        }
        Insert: {
          id?: string
          external_fixture_id: number
          home_team_id: string
          away_team_id: string
          starts_at: string
          status?: 'NS' | 'LIVE' | 'HT' | 'FT' | 'PST' | 'CANC'
          home_goals?: number
          away_goals?: number
        }
        Update: {
          status?: 'NS' | 'LIVE' | 'HT' | 'FT' | 'PST' | 'CANC'
          home_goals?: number
          away_goals?: number
        }
        Relationships: [
          {
            foreignKeyName: 'matches_home_team_id_fkey'
            columns: ['home_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matches_away_team_id_fkey'
            columns: ['away_team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      live_events: {
        Row: {
          id: string
          match_id: string
          external_event_id: string
          event_type: 'goal' | 'kickoff' | 'halftime' | 'fulltime' | 'reaction_created'
          team_id: string | null
          team_name: string | null
          minute: number | null
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          external_event_id: string
          event_type: string
          team_id?: string | null
          team_name?: string | null
          minute?: number | null
          payload?: Json
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      reactions: {
        Row: {
          id: string
          match_id: string
          user_id: string
          event_id: string | null
          video_url: string
          thumbnail_url: string | null
          duration_ms: number
          storage_path: string | null
          mime_type: string
          upload_status: 'uploading' | 'ready' | 'failed'
          moderation_status: 'visible' | 'hidden' | 'flagged'
          published_at: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          event_id?: string | null
          video_url: string
          thumbnail_url?: string | null
          duration_ms: number
          storage_path?: string | null
          mime_type?: string
          upload_status?: 'uploading' | 'ready' | 'failed'
          moderation_status?: 'visible' | 'hidden' | 'flagged'
          published_at?: string
          score?: number
          created_at?: string
        }
        Update: {
          thumbnail_url?: string | null
          storage_path?: string | null
          mime_type?: string
          upload_status?: 'uploading' | 'ready' | 'failed'
          moderation_status?: 'visible' | 'hidden' | 'flagged'
          published_at?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: 'reactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reactions_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reactions_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'live_events'
            referencedColumns: ['id']
          },
        ]
      }
      reaction_likes: {
        Row: {
          reaction_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          reaction_id: string
          user_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      match_subscriptions: {
        Row: {
          id: string
          match_id: string
          user_id: string | null
          expo_push_token: string
          push_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id?: string | null
          expo_push_token: string
          push_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          push_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          id: string
          user_id: string
          expo_push_token: string
          platform: 'ios' | 'android' | 'web'
          device_id: string | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expo_push_token: string
          platform: 'ios' | 'android' | 'web'
          device_id?: string | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          expo_push_token?: string
          platform?: 'ios' | 'android' | 'web'
          device_id?: string | null
          enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          match_id: string | null
          caption: string | null
          image_url: string
          storage_path: string | null
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id?: string | null
          caption?: string | null
          image_url: string
          storage_path?: string | null
          score?: number
          created_at?: string
        }
        Update: {
          caption?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_match_id_fkey'
            columns: ['match_id']
            isOneToOne: false
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
        ]
      }
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string }
        Insert: { post_id: string; user_id: string; created_at?: string }
        Update: Record<string, never>
        Relationships: []
      }
      match_goal_state: {
        Row: {
          match_id: string
          home_goals: number
          away_goals: number
          updated_at: string
        }
        Insert: {
          match_id: string
          home_goals?: number
          away_goals?: number
          updated_at?: string
        }
        Update: {
          home_goals?: number
          away_goals?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      upsert_push_token: {
        Args: {
          token: string
          token_platform: 'ios' | 'android' | 'web'
          token_device_id?: string | null
        }
        Returns: Database['public']['Tables']['push_tokens']['Row']
      }
      subscribe_to_match: {
        Args: {
          target_match_id: string
          token: string
        }
        Returns: Database['public']['Tables']['match_subscriptions']['Row']
      }
      unsubscribe_from_match: {
        Args: {
          target_match_id: string
        }
        Returns: void
      }
      create_reaction: {
        Args: {
          target_match_id: string
          target_event_id: string | null
          target_video_url: string
          target_thumbnail_url: string | null
          target_duration_ms: number
          target_storage_path?: string | null
          target_mime_type?: string
        }
        Returns: Database['public']['Tables']['reactions']['Row']
      }
      upsert_own_profile: {
        Args: {
          target_username: string
          target_team_id?: string | null
        }
        Returns: Database['public']['Tables']['profiles']['Row']
      }
      create_post: {
        Args: {
          target_image_url: string
          target_caption?: string | null
          target_match_id?: string | null
          target_storage_path?: string | null
        }
        Returns: Database['public']['Tables']['posts']['Row']
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Profile = Tables<'profiles'>
export type Team = Tables<'teams'>
export type Match = Tables<'matches'>
export type LiveEvent = Tables<'live_events'>
export type Reaction = Tables<'reactions'>
export type MatchSubscription = Tables<'match_subscriptions'>
export type PushToken = Tables<'push_tokens'>
export type Post = Tables<'posts'>
export type PostLike = Tables<'post_likes'>

export type MatchWithTeams = Match & {
  home_team: Team
  away_team: Team
}
