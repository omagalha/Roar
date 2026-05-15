import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Match } from '@/types/match'
import { MatchStatusPill } from './MatchStatusPill'
import { colors, spacing, font, radius } from '@/lib/theme'

type Props = {
  match: Match
  onPress: (id: string) => void
}

function formatCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

export function LiveMatchCard({ match, onPress }: Props) {
  const { t } = useTranslation()

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const canNavigate = isLive || isFinished

  const ctaLabel = isLive
    ? t('matches.enterRoom')
    : isFinished
      ? t('matches.bestRoars')
      : t('matches.setAlert')

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isLive && styles.cardLive,
        isLive && match.featured && styles.cardFeatured,
      ]}
      onPress={() => onPress(match.id)}
      activeOpacity={0.82}
    >
      {/* ── Status + time ── */}
      <View style={styles.topRow}>
        <MatchStatusPill status={match.status} />
        {isLive && match.minute !== undefined && (
          <Text style={styles.minute}>{match.minute}'</Text>
        )}
        {match.status === 'upcoming' && match.startsAtLabel ? (
          <Text style={styles.startsAt}>{match.startsAtLabel}</Text>
        ) : null}
      </View>

      {/* ── Score ── */}
      <View style={styles.scoreRow}>
        <View style={styles.teamLeft}>
          <Text style={styles.flag}>{match.homeTeam.flag}</Text>
          <Text style={styles.teamName}>{match.homeTeam.shortName}</Text>
        </View>

        <View style={styles.scoreCenter}>
          {match.status !== 'upcoming' ? (
            <Text style={[styles.score, isLive && styles.scoreLive]}>
              {match.homeScore} — {match.awayScore}
            </Text>
          ) : (
            <Text style={styles.scoreVs}>×</Text>
          )}
        </View>

        <View style={styles.teamRight}>
          <Text style={styles.flag}>{match.awayTeam.flag}</Text>
          <Text style={styles.teamName}>{match.awayTeam.shortName}</Text>
        </View>
      </View>

      {/* ── Meta ── */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          🔥 {formatCount(match.roarCount)} {t('matches.roars')}
        </Text>
        {match.onlineCount > 0 && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <View style={styles.onlineDot} />
            <Text style={styles.metaText}>
              {formatCount(match.onlineCount)} {t('matches.online')}
            </Text>
          </>
        )}
      </View>

      {/* ── CTA ── */}
      <View style={styles.ctaRow}>
        <Text style={[styles.ctaText, !canNavigate && styles.ctaTextMuted]}>
          {ctaLabel}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={14}
          color={canNavigate ? colors.red : colors.mutedLight}
        />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm + 2,
  },
  cardLive: {
    borderColor: 'rgba(232,0,45,0.28)',
    backgroundColor: '#0f0a16',
  },
  cardFeatured: {
    borderColor: 'rgba(232,0,45,0.5)',
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },

  /* Top row */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  minute: {
    color: colors.red,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },
  startsAt: {
    color: colors.mutedLight,
    fontSize: font.size.sm,
  },

  /* Score */
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLeft: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  teamRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  flag: {
    fontSize: 34,
    lineHeight: 40,
  },
  teamName: {
    color: colors.mutedLight,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 1.2,
  },
  scoreCenter: {
    width: 88,
    alignItems: 'center',
  },
  score: {
    color: colors.text,
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
  },
  scoreLive: {
    color: colors.white,
    fontSize: font.size.xxl,
  },
  scoreVs: {
    color: colors.border,
    fontSize: font.size.xl,
    letterSpacing: 4,
  },

  /* Meta */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    color: colors.muted,
    fontSize: font.size.xs,
  },
  metaDot: {
    color: colors.border,
    fontSize: font.size.xs,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },

  /* CTA */
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  ctaText: {
    color: colors.red,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },
  ctaTextMuted: {
    color: colors.mutedLight,
    fontWeight: font.weight.medium,
  },
})
