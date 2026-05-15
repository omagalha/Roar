export type TeamOption = {
  id: string
  name: string
  country: string
  flag: string
  group: string
}

export const WORLD_CUP_TEAMS: TeamOption[] = [
  // América do Sul
  { id: 'BR', name: 'Brasil', country: 'BR', flag: '🇧🇷', group: 'América do Sul' },
  { id: 'AR', name: 'Argentina', country: 'AR', flag: '🇦🇷', group: 'América do Sul' },
  { id: 'UY', name: 'Uruguai', country: 'UY', flag: '🇺🇾', group: 'América do Sul' },
  { id: 'CO', name: 'Colômbia', country: 'CO', flag: '🇨🇴', group: 'América do Sul' },
  { id: 'EC', name: 'Equador', country: 'EC', flag: '🇪🇨', group: 'América do Sul' },
  { id: 'VE', name: 'Venezuela', country: 'VE', flag: '🇻🇪', group: 'América do Sul' },
  // Europa
  { id: 'FR', name: 'França', country: 'FR', flag: '🇫🇷', group: 'Europa' },
  { id: 'ES', name: 'Espanha', country: 'ES', flag: '🇪🇸', group: 'Europa' },
  { id: 'DE', name: 'Alemanha', country: 'DE', flag: '🇩🇪', group: 'Europa' },
  { id: 'PT', name: 'Portugal', country: 'PT', flag: '🇵🇹', group: 'Europa' },
  { id: 'EN', name: 'Inglaterra', country: 'GB', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'Europa' },
  { id: 'IT', name: 'Itália', country: 'IT', flag: '🇮🇹', group: 'Europa' },
  { id: 'NL', name: 'Holanda', country: 'NL', flag: '🇳🇱', group: 'Europa' },
  { id: 'BE', name: 'Bélgica', country: 'BE', flag: '🇧🇪', group: 'Europa' },
  { id: 'HR', name: 'Croácia', country: 'HR', flag: '🇭🇷', group: 'Europa' },
  // América do Norte
  { id: 'US', name: 'EUA', country: 'US', flag: '🇺🇸', group: 'América do Norte' },
  { id: 'MX', name: 'México', country: 'MX', flag: '🇲🇽', group: 'América do Norte' },
  { id: 'CA', name: 'Canadá', country: 'CA', flag: '🇨🇦', group: 'América do Norte' },
  // África
  { id: 'MA', name: 'Marrocos', country: 'MA', flag: '🇲🇦', group: 'África' },
  { id: 'SN', name: 'Senegal', country: 'SN', flag: '🇸🇳', group: 'África' },
  { id: 'NG', name: 'Nigéria', country: 'NG', flag: '🇳🇬', group: 'África' },
  // Ásia/Oceania
  { id: 'JP', name: 'Japão', country: 'JP', flag: '🇯🇵', group: 'Ásia' },
  { id: 'KR', name: 'Coreia do Sul', country: 'KR', flag: '🇰🇷', group: 'Ásia' },
  { id: 'SA', name: 'Arábia Saudita', country: 'SA', flag: '🇸🇦', group: 'Ásia' },
  { id: 'AU', name: 'Austrália', country: 'AU', flag: '🇦🇺', group: 'Oceania' },
]

export const TEAMS_BY_GROUP = WORLD_CUP_TEAMS.reduce<Record<string, TeamOption[]>>((acc, team) => {
  if (!acc[team.group]) acc[team.group] = []
  acc[team.group].push(team)
  return acc
}, {})
