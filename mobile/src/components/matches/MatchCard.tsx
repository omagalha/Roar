import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { MatchWithTeams } from '@/types/database'
import { colors, spacing, radius, font } from '@/lib/theme'

type Props = { match: MatchWithTeams }

const FLAG: Record<string, string> = {
  BR: '🇧🇷', AR: '🇦🇷', FR: '🇫🇷', DE: '🇩🇪',
  ES: '🇪🇸', PT: '🇵🇹', GB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', IT: '🇮🇹',
  US: '🇺🇸', MX: '🇲🇽', CO: '🇨🇴', UY: '🇺🇾',
}

function statusLabel(status: MatchWithTeams['status'], startsAt: string) {
  switch (status) {
    case 'LIVE': return { label: 'AO VIVO', color: colors.red }
    case 'HT':   return { label: 'INTERVALO', color: colors.gold }
    case 'FT':   return { label: 'ENCERRADO', color: colors.muted }
    case 'NS': {
      const diff = new Date(startsAt).getTime() - Date.now()
      const h = Math.floor(diff / 1000 / 60 / 60)
      const m = Math.floor((diff / 1000 / 60) % 60)
      const label = diff < 1000 * 60 * 60
        ? `em ${m}min`
        : `${h}h${m > 0 ? `${m}min` : ''}`
      return { label, color: colors.muted }
    }
    default: return { label: status, color: colors.muted }
  }
}

export function MatchCard({ match }: Props) {
  const router = useRouter()
  const { label, color } = statusLabel(match.status, match.starts_at)
  const isLive = match.status === 'LIVE' || match.status === 'HT'

  return (
    <TouchableOpacity
      style={[styles.card, isLive && styles.cardLive]}
      onPress={() => router.push(`/match/${match.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.statusRow}>
        {isLive && <View style={styles.liveDot} />}
        <Text style={[styles.status, { color }]}>{label}</Text>
      </View>

      <View style={styles.teams}>
        <View style={styles.team}>
          <Text style={styles.flag}>
            {FLAG[match.home_team.country] ?? '🏳️'}
          </Text>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.home_team.name}
          </Text>
        </View>

        <View style={styles.score}>
          {isLive || match.status === 'FT' ? (
            <Text style={styles.scoreText}>
              {match.home_goals} <Text style={styles.scoreSep}>×</Text> {match.away_goals}
            </Text>
          ) : (
            <Text style={styles.vsText}>vs</Text>
          )}
        </View>

        <View style={[styles.team, styles.teamRight]}>
          <Text style={styles.flag}>
            {FLAG[match.away_team.country] ?? '🏳️'}
          </Text>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
            {match.away_team.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardLive: {
    borderColor: '#E8002D40',
    backgroundColor: '#0d0d1a',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.red,
  },
  status: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  teamRight: {
    alignItems: 'flex-end',
  },
  flag: {
    fontSize: 28,
  },
  teamName: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.medium,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  score: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.white,
    letterSpacing: 2,
  },
  scoreSep: {
    color: colors.muted,
    fontWeight: font.weight.regular,
  },
  vsText: {
    fontSize: font.size.md,
    color: colors.muted,
    fontWeight: font.weight.medium,
  },
})
