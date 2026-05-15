export type MatchStatus = 'live' | 'upcoming' | 'finished'

export type MatchTeam = {
  name: string
  shortName: string
  flag: string
  color?: string
}

export type Match = {
  id: string
  homeTeam: MatchTeam
  awayTeam: MatchTeam
  homeScore: number
  awayScore: number
  status: MatchStatus
  minute?: number
  startsAtLabel?: string
  roarCount: number
  onlineCount: number
  featured?: boolean
}
