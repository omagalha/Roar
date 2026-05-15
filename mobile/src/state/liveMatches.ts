import { create } from 'zustand'
import { Match } from '@/types/match'

const MOCK_MATCHES: Match[] = [
  {
    id: 'brasil-argentina',
    homeTeam: { name: 'Brasil', shortName: 'BRA', flag: '🇧🇷', color: '#009C3B' },
    awayTeam: { name: 'Argentina', shortName: 'ARG', flag: '🇦🇷', color: '#74ACDF' },
    homeScore: 1,
    awayScore: 0,
    status: 'live',
    minute: 67,
    roarCount: 1248,
    onlineCount: 847,
    featured: true,
  },
  {
    id: 'argentina-uruguai',
    homeTeam: { name: 'Argentina', shortName: 'ARG', flag: '🇦🇷', color: '#74ACDF' },
    awayTeam: { name: 'Uruguai', shortName: 'URU', flag: '🇺🇾', color: '#75AADB' },
    homeScore: 0,
    awayScore: 0,
    status: 'live',
    minute: 32,
    roarCount: 432,
    onlineCount: 318,
  },
  {
    id: 'franca-alemanha',
    homeTeam: { name: 'França', shortName: 'FRA', flag: '🇫🇷', color: '#002395' },
    awayTeam: { name: 'Alemanha', shortName: 'GER', flag: '🇩🇪', color: '#000000' },
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming',
    startsAtLabel: 'Hoje 18h',
    roarCount: 218,
    onlineCount: 156,
  },
  {
    id: 'espanha-portugal',
    homeTeam: { name: 'Espanha', shortName: 'ESP', flag: '🇪🇸', color: '#AA151B' },
    awayTeam: { name: 'Portugal', shortName: 'POR', flag: '🇵🇹', color: '#006600' },
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming',
    startsAtLabel: 'Hoje 21h',
    roarCount: 891,
    onlineCount: 634,
  },
  {
    id: 'inglaterra-italia',
    homeTeam: { name: 'Inglaterra', shortName: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#CF091F' },
    awayTeam: { name: 'Itália', shortName: 'ITA', flag: '🇮🇹', color: '#009246' },
    homeScore: 2,
    awayScore: 1,
    status: 'finished',
    roarCount: 3204,
    onlineCount: 0,
  },
]

type LiveMatchesStore = {
  matches: Match[]
}

export const useLiveMatchesStore = create<LiveMatchesStore>(() => ({
  matches: MOCK_MATCHES,
}))
