import { useRef } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types/database'
import { useAuthStore } from '@/state/auth'

const PAGE_SIZE = 15

export type PostWithProfile = Post & {
  profile?: { username: string; avatar_url: string | null }
  match?: { id: string; home_team: { name: string; country: string }; away_team: { name: string; country: string } } | null
  comments_count?: number
}

async function fetchFeed(cursor?: string): Promise<PostWithProfile[]> {
  let query = supabase
    .from('posts')
    .select('*, profile:profiles(username, avatar_url), match:matches(id, home_team:teams!matches_home_team_id_fkey(name, country), away_team:teams!matches_away_team_id_fkey(name, country))')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) query = query.lt('created_at', cursor)

  const { data } = await query
  return (data ?? []) as PostWithProfile[]
}

export function useGlobalFeed() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const likedIdsRef = useRef(new Set<string>())

  const query = useInfiniteQuery({
    queryKey: ['global-feed'],
    queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].created_at : undefined,
  })

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user!.id })
    },
    onMutate: async (postId) => {
      likedIdsRef.current.add(postId)
      queryClient.setQueryData(
        ['global-feed'],
        (prev: { pages: PostWithProfile[][] } | undefined) => {
          if (!prev) return prev
          return {
            ...prev,
            pages: prev.pages.map((page) =>
              page.map((p) => p.id === postId ? { ...p, score: p.score + 1 } : p),
            ),
          }
        },
      )
    },
  })

  const posts = query.data?.pages.flat() ?? []

  return {
    posts,
    isLoading: query.isLoading,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    like: likeMutation.mutate,
    isLiked: (id: string) => likedIdsRef.current.has(id),
  }
}
