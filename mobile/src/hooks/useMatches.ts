import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MatchWithTeams } from '@/types/database'

const MOCK_MATCHES: MatchWithTeams[] = [
  {
    id: 'mock-1',
    external_fixture_id: 1001,
    home_team_id: 'br',
    away_team_id: 'ar',
    starts_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'LIVE',
    home_goals: 1,
    away_goals: 1,
    home_team: { id: 'br', name: 'Brasil', country: 'BR', badge_url: null },
    away_team: { id: 'ar', name: 'Argentina', country: 'AR', badge_url: null },
  },
  {
    id: 'mock-2',
    external_fixture_id: 1002,
    home_team_id: 'fr',
    away_team_id: 'de',
    starts_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    status: 'NS',
    home_goals: 0,
    away_goals: 0,
    home_team: { id: 'fr', name: 'França', country: 'FR', badge_url: null },
    away_team: { id: 'de', name: 'Alemanha', country: 'DE', badge_url: null },
  },
  {
    id: 'mock-3',
    external_fixture_id: 1003,
    home_team_id: 'es',
    away_team_id: 'pt',
    starts_at: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    status: 'NS',
    home_goals: 0,
    away_goals: 0,
    home_team: { id: 'es', name: 'Espanha', country: 'ES', badge_url: null },
    away_team: { id: 'pt', name: 'Portugal', country: 'PT', badge_url: null },
  },
  {
    id: 'mock-4',
    external_fixture_id: 1004,
    home_team_id: 'en',
    away_team_id: 'it',
    starts_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: 'FT',
    home_goals: 2,
    away_goals: 1,
    home_team: { id: 'en', name: 'Inglaterra', country: 'GB', badge_url: null },
    away_team: { id: 'it', name: 'Itália', country: 'IT', badge_url: null },
  },
]

async function fetchMatches(): Promise<MatchWithTeams[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .order('starts_at', { ascending: true })

  if (error || !data?.length) return MOCK_MATCHES
  return data as MatchWithTeams[]
}

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
