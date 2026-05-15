import { create } from 'zustand'
import { MockPost } from '@/components/feed/SocialPostCard'

type DraftPost = {
  user: MockPost['user']
  content: string
  imageUrl?: string | null
  matchLabel?: string | null
  isLive?: boolean
}

type State = {
  posts: MockPost[]
  addPost: (draft: DraftPost) => void
}

export const useLocalFeedStore = create<State>((set) => ({
  posts: [],
  addPost: (draft) =>
    set((state) => ({
      posts: [
        {
          ...draft,
          id: `local-${Date.now()}`,
          roarCount: 0,
          commentCount: 0,
          repostCount: 0,
          isRoared: false,
          createdAt: new Date().toISOString(),
        },
        ...state.posts,
      ],
    })),
}))
