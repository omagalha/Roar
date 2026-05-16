import { create } from 'zustand'
import { RoarUser } from '@/types/user'

const MOCK_USERS: RoarUser[] = [
  {
    id: 'u-thales',
    username: 'thales',
    displayName: 'Thales',
    avatarInitial: 'T',
    bio: 'O futebol não foi feito para ser assistido em silêncio.',
    nationalTeam: '🇧🇷 Brasil',
    favoriteClub: 'Flamengo',
    followersCount: 1248,
    followingCount: 312,
    postsCount: 89,
  },
  {
    id: 'u-gabi',
    username: 'gabi_torcida',
    displayName: 'Gabi Torcida',
    avatarInitial: 'G',
    bio: 'Torcida brasileira nunca silencia. Vamo Brasil! 💚',
    nationalTeam: '🇧🇷 Brasil',
    favoriteClub: 'Santos',
    followersCount: 3891,
    followingCount: 564,
    postsCount: 214,
  },
  {
    id: 'u-narrador',
    username: 'narrador_br',
    displayName: 'Narrador BR',
    avatarInitial: 'N',
    bio: 'Descrevendo cada jogada como se fosse a última. ⚽🎙️',
    nationalTeam: '🇧🇷 Brasil',
    favoriteClub: 'Corinthians',
    followersCount: 12400,
    followingCount: 890,
    postsCount: 1032,
  },
  {
    id: 'u-copa2026',
    username: 'copa2026',
    displayName: 'Copa 2026',
    avatarInitial: 'C',
    bio: 'Sua fonte de informação da Copa do Mundo 2026. 🌎🏆',
    nationalTeam: '🌎 Mundial',
    favoriteClub: 'Futebol',
    followersCount: 48200,
    followingCount: 12,
    postsCount: 456,
  },
  {
    id: 'u-resenha',
    username: 'resenha_futebol',
    displayName: 'Resenha Futebol',
    avatarInitial: 'R',
    bio: 'Análises, debates e resenha pura do futebol mundial.',
    nationalTeam: '🇧🇷 Brasil',
    favoriteClub: 'São Paulo',
    followersCount: 8732,
    followingCount: 234,
    postsCount: 378,
  },
]

type UsersStore = {
  users: RoarUser[]
  getUserByUsername: (username: string) => RoarUser | undefined
  searchUsers: (query: string) => RoarUser[]
}

export const useUsersStore = create<UsersStore>()(() => ({
  users: MOCK_USERS,

  getUserByUsername: (username) =>
    MOCK_USERS.find((u) => u.username === username),

  searchUsers: (query) => {
    if (!query.trim()) return MOCK_USERS
    const lower = query.toLowerCase()
    return MOCK_USERS.filter(
      (u) =>
        u.username.toLowerCase().includes(lower) ||
        u.displayName.toLowerCase().includes(lower) ||
        u.bio.toLowerCase().includes(lower),
    )
  },
}))
