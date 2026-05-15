import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { Profile } from '@/types/database'

type AuthState = {
  session: Session | null
  user: User | null
  profile: Profile | null
  initialized: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setInitialized: () => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setProfile: (profile) =>
    set({ profile }),
  setInitialized: () =>
    set({ initialized: true }),
  signOut: () =>
    set({ session: null, user: null, profile: null }),
}))
