import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import type { StateStorage } from 'zustand/middleware'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Post, PostContext } from '@/types/post'

const now = Date.now()
const memoryStorage = new Map<string, string>()

const safePostStorage: StateStorage = {
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
    } catch {
      // Expo Go can load without the native AsyncStorage module. Keep the store usable.
    }
  },
  removeItem: async (name) => {
    memoryStorage.delete(name)
    try {
      await AsyncStorage.removeItem(name)
    } catch {
      // Same fallback as setItem: no native storage, no crash.
    }
  },
}

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    username: 'thales',
    avatarInitial: 'T',
    teamFlag: '🇧🇷',
    text: 'Brasil hoje joga leve. Se fizer o primeiro, vira goleada.',
    context: 'general',
    isLive: false,
    roarCount: 248,
    isRoared: false,
    commentsCount: 34,
    repostsCount: 12,
    createdAt: new Date(now - 1000 * 60 * 14).toISOString(),
  },
  {
    id: '2',
    username: 'gabi_torcida',
    avatarInitial: 'G',
    teamFlag: '🇧🇷',
    text: 'Não tem coração igual ao do torcedor brasileiro. Copa ou não Copa, a gente sempre vai.',
    matchLabel: '🇧🇷 Brasil × 🇫🇷 França · Hoje 18h',
    context: 'pre_match',
    isLive: false,
    roarCount: 891,
    isRoared: true,
    commentsCount: 127,
    repostsCount: 64,
    createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    username: 'narrador_br',
    avatarInitial: 'N',
    teamFlag: '🇧🇷',
    text: 'Mbappé chega quieto. França vai pesar muito na fase de grupos, cuidado.',
    context: 'general',
    isLive: false,
    roarCount: 156,
    isRoared: false,
    commentsCount: 22,
    repostsCount: 8,
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    username: 'copa2026',
    avatarInitial: 'C',
    teamFlag: '🌎',
    text: 'Mês mais esperado do mundo. Que comecem os jogos.',
    matchLabel: '🇦🇷 Argentina × 🇺🇾 Uruguai · AO VIVO 67\'',
    context: 'live',
    isLive: true,
    roarCount: 1204,
    isRoared: false,
    commentsCount: 89,
    repostsCount: 230,
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '5',
    username: 'resenha_futebol',
    avatarInitial: 'R',
    teamFlag: '🇧🇷',
    text: 'Quem não acredita que a Argentina defende o título não entende de futebol. Eles são completos.',
    context: 'general',
    isLive: false,
    roarCount: 432,
    isRoared: false,
    commentsCount: 76,
    repostsCount: 33,
    createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: '6',
    username: 'jogo_bonito',
    avatarInitial: 'J',
    teamFlag: '🇵🇹',
    text: 'Portugal sem CR7 na seleção principal vai ser diferente. Mas tem talento de sobra.',
    context: 'general',
    isLive: false,
    roarCount: 319,
    isRoared: false,
    commentsCount: 51,
    repostsCount: 17,
    createdAt: new Date(now - 1000 * 60 * 60 * 11).toISOString(),
  },
]

type DraftPost = {
  username: string
  avatarInitial: string
  teamFlag: string
  text: string
  imageUrl?: string | null
  context: PostContext
}

type PostsStore = {
  posts: Post[]
  addPost: (draft: DraftPost) => void
  toggleRoar: (id: string) => void
}

export const usePostsStore = create<PostsStore>()(
  persist(
    (set) => ({
      posts: INITIAL_POSTS,

      addPost: (draft) =>
        set((state) => ({
          posts: [
            {
              ...draft,
              id: `local-${Date.now()}`,
              matchLabel:
                draft.context === 'pre_match'
                  ? '⚽ Pré-jogo'
                  : draft.context === 'live'
                    ? '🔴 Ao vivo'
                    : null,
              isLive: draft.context === 'live',
              roarCount: 0,
              isRoared: false,
              commentsCount: 0,
              repostsCount: 0,
              createdAt: new Date().toISOString(),
            },
            ...state.posts,
          ],
        })),

      toggleRoar: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  isRoared: !p.isRoared,
                  roarCount: Math.max(
                    0,
                    p.roarCount + (p.isRoared ? -1 : 1),
                  ),
                }
              : p,
          ),
        })),
    }),
    {
      name: 'roar-posts-v2',
      storage: createJSONStorage(() => safePostStorage),
    },
  ),
)
