import { useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Reaction } from '@/types/database'
import { useAuthStore } from '@/state/auth'

const PAGE_SIZE = 10

export type ReactionWithProfile = Reaction & {
  profile?: { username: string; avatar_url: string | null }
}

async function fetchReactions(matchId: string, cursor?: string): Promise<ReactionWithProfile[]> {
  let query = supabase
    .from('reactions')
    .select('*, profile:profiles(username, avatar_url)')
    .eq('match_id', matchId)
    .eq('upload_status', 'ready')
    .eq('moderation_status', 'visible')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) query = query.lt('created_at', cursor)

  const { data } = await query
  return (data ?? []) as ReactionWithProfile[]
}

export function useReactions(matchId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const likedIdsRef = useRef<Set<string>>(new Set())

  const query = useInfiniteQuery({
    queryKey: ['reactions', matchId],
    queryFn: ({ pageParam }) => fetchReactions(matchId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].created_at : undefined,
  })

  useEffect(() => {
    const channel = supabase
      .channel(`match:${matchId}:feed`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newReaction = payload.new as Reaction
          if (newReaction.upload_status !== 'ready' || newReaction.moderation_status !== 'visible') return
          queryClient.setQueryData(
            ['reactions', matchId],
            (prev: { pages: ReactionWithProfile[][] } | undefined) => {
              if (!prev) return prev
              return {
                ...prev,
                pages: [[newReaction as ReactionWithProfile, ...prev.pages[0]], ...prev.pages.slice(1)],
              }
            },
          )
        },
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [matchId, queryClient])

  const likeMutation = useMutation({
    mutationFn: async (reactionId: string) => {
      await supabase.from('reaction_likes').insert({ reaction_id: reactionId, user_id: user!.id })
    },
    onMutate: async (reactionId) => {
      likedIdsRef.current.add(reactionId)
      queryClient.setQueryData(
        ['reactions', matchId],
        (prev: { pages: ReactionWithProfile[][] } | undefined) => {
          if (!prev) return prev
          return {
            ...prev,
            pages: prev.pages.map((page) =>
              page.map((r) => r.id === reactionId ? { ...r, score: r.score + 1 } : r),
            ),
          }
        },
      )
    },
  })

  const reactions = query.data?.pages.flat() ?? []

  return {
    reactions,
    isLoading: query.isLoading,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    like: likeMutation.mutate,
    isLiked: (id: string) => likedIdsRef.current.has(id),
  }
}
