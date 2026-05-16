import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

const memoryStorage = new Map<string, string>()

const safeSocialStorage: StateStorage = {
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

type SocialGraphStore = {
  followingUsernames: string[]
  follow: (username: string) => void
  unfollow: (username: string) => void
  isFollowing: (username: string) => boolean
}

export const useSocialGraphStore = create<SocialGraphStore>()(
  persist(
    (set, get) => ({
      followingUsernames: [],

      follow: (username) =>
        set((state) => ({
          followingUsernames: state.followingUsernames.includes(username)
            ? state.followingUsernames
            : [...state.followingUsernames, username],
        })),

      unfollow: (username) =>
        set((state) => ({
          followingUsernames: state.followingUsernames.filter((u) => u !== username),
        })),

      isFollowing: (username) => get().followingUsernames.includes(username),
    }),
    {
      name: 'roar-social-graph-v1',
      storage: createJSONStorage(() => safeSocialStorage),
    },
  ),
)
