import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { LiveEvent, MatchWithTeams } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

async function fetchMatch(matchId: string): Promise<MatchWithTeams | null> {
  const { data } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('id', matchId)
    .single()
  return data as MatchWithTeams | null
}

async function fetchRecentEvents(matchId: string): Promise<LiveEvent[]> {
  const { data } = await supabase
    .from('live_events')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as LiveEvent[]
}

export function useMatchRoom(matchId: string) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const matchQuery = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
    staleTime: 10_000,
  })

  const eventsQuery = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => fetchRecentEvents(matchId),
    staleTime: 5_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel(`match:${matchId}:events`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_events',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newEvent = payload.new as LiveEvent

          queryClient.setQueryData<LiveEvent[]>(
            ['match-events', matchId],
            (prev) => [newEvent, ...(prev ?? [])],
          )

          if (newEvent.event_type === 'goal') {
            queryClient.invalidateQueries({ queryKey: ['match', matchId] })
          }
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [matchId, queryClient])

  return {
    match: matchQuery.data,
    events: eventsQuery.data ?? [],
    isLoading: matchQuery.isLoading,
    latestEvent: eventsQuery.data?.[0] ?? null,
  }
}
