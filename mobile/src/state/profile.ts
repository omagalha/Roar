import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { UserProfile } from '@/types/profile'

const memoryStorage = new Map<string, string>()

const safeProfileStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name)
    } catch {
      return memoryStorage.get(name) ?? null
    }
  },
  setItem: async (name, value) => {
    memoryStorage.set(name, value)
    try {
      await AsyncStorage.setItem(name, value)
    } catch {}
  },
  removeItem: async (name) => {
    memoryStorage.delete(name)
    try {
      await AsyncStorage.removeItem(name)
    } catch {}
  },
}

type OnboardingData = {
  username: string
  nationalTeam: string
  favoriteClub?: string
}

type ProfileStore = {
  profile: UserProfile
  hasCompletedOnboarding: boolean
  completeOnboarding: (data: OnboardingData) => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

const DEFAULT_PROFILE: UserProfile = {
  username: '',
  displayName: '',
  avatarInitial: '',
  bio: '',
  nationalTeam: '',
  favoriteClub: '',
  avatarUrl: null,
  coverUrl: null,
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      hasCompletedOnboarding: false,

      completeOnboarding: ({ username, nationalTeam, favoriteClub }) =>
        set({
          hasCompletedOnboarding: true,
          profile: {
            ...DEFAULT_PROFILE,
            username,
            displayName: username,
            avatarInitial: username[0]?.toUpperCase() ?? '?',
            nationalTeam,
            favoriteClub: favoriteClub ?? '',
            bio: 'O futebol não foi feito para ser assistido em silêncio.',
          },
        }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
    }),
    {
      name: 'roar-profile-v2',
      storage: createJSONStorage(() => safeProfileStorage),
    },
  ),
)
