import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { MatchChatMessage } from '@/types/matchChat'

const memoryStorage = new Map<string, string>()

const safeChatStorage: StateStorage = {
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

type MatchChatStore = {
  messagesByMatchId: Record<string, MatchChatMessage[]>
  getMessages: (matchId: string) => MatchChatMessage[]
  addMessage: (
    matchId: string,
    text: string,
    author: { username: string; avatarInitial: string; teamFlag?: string },
  ) => void
  seedMessages: (matchId: string, homeTeam: string, awayTeam: string) => void
}

function buildSeedMessages(matchId: string, homeTeam: string, awayTeam: string): MatchChatMessage[] {
  const now = Date.now()
  return [
    {
      id: `${matchId}-s1`,
      matchId,
      username: 'thales',
      avatarInitial: 'T',
      text: `hoje é nosso! vai ${homeTeam}! 🔥`,
      createdAt: now - 5 * 60_000,
    },
    {
      id: `${matchId}-s2`,
      matchId,
      username: 'gabi_torcida',
      avatarInitial: 'G',
      text: 'ninguém segura essa torcida',
      createdAt: now - 3 * 60_000,
    },
    {
      id: `${matchId}-s3`,
      matchId,
      username: 'narrador_br',
      avatarInitial: 'N',
      text: 'jogo quente demais 😤',
      createdAt: now - 2 * 60_000,
    },
    {
      id: `${matchId}-s4`,
      matchId,
      username: 'torcedor10',
      avatarInitial: 'T',
      text: `${awayTeam} tá sofrendo hoje`,
      createdAt: now - 60_000,
    },
  ]
}

export const useMatchChatStore = create<MatchChatStore>()(
  persist(
    (set, get) => ({
      messagesByMatchId: {},

      getMessages: (matchId) => get().messagesByMatchId[matchId] ?? [],

      addMessage: (matchId, text, { username, avatarInitial, teamFlag }) => {
        const message: MatchChatMessage = {
          id: `${matchId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          matchId,
          username,
          avatarInitial,
          text,
          createdAt: Date.now(),
          teamFlag,
        }
        set((state) => ({
          messagesByMatchId: {
            ...state.messagesByMatchId,
            [matchId]: [...(state.messagesByMatchId[matchId] ?? []), message],
          },
        }))
      },

      seedMessages: (matchId, homeTeam, awayTeam) => {
        const existing = get().messagesByMatchId[matchId]
        if (existing && existing.length > 0) return
        set((state) => ({
          messagesByMatchId: {
            ...state.messagesByMatchId,
            [matchId]: buildSeedMessages(matchId, homeTeam, awayTeam),
          },
        }))
      },
    }),
    {
      name: 'roar-match-chat-v1',
      storage: createJSONStorage(() => safeChatStorage),
    },
  ),
)
