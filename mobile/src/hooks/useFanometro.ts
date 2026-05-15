import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { WORLD_CUP_TEAMS } from '@/lib/teams'

export type FanEntry = {
  teamId: string
  teamName: string
  flag: string
  count: number
}

async function fetchFanometro(matchId: string): Promise<FanEntry[]> {
  const { data } = await supabase
    .from('reactions')
    .select('user_id, profiles!inner(team_id)')
    .eq('match_id', matchId)
    .eq('upload_status', 'ready')

  if (!data?.length) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const teamId = (row.profiles as { team_id: string | null })?.team_id
    if (!teamId) continue
    counts.set(teamId, (counts.get(teamId) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([teamId, count]) => {
      const team = WORLD_CUP_TEAMS.find((t) => t.id === teamId)
      return {
        teamId,
        teamName: team?.name ?? teamId,
        flag: team?.flag ?? '🏳️',
        count,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export function useFanometro(matchId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['fanometro', matchId],
    queryFn: () => fetchFanometro(matchId),
    staleTime: 20_000,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel(`fanometro:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions', filter: `match_id=eq.${matchId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['fanometro', matchId] }) },
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [matchId, queryClient])

  return { entries: query.data ?? [], isLoading: query.isLoading }
}
