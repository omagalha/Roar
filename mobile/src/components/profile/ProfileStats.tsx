import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing, font } from '@/lib/theme'

type Props = {
  postsCount: number
  mediaCount: number
  receivedRoarsCount: number
  roaredPostsCount: number
}

function formatStat(value: number): string {
  if (value >= 10000) return `${Math.round(value / 1000)}k`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`
  return String(value)
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{formatStat(value)}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

export function ProfileStats({ postsCount, mediaCount, receivedRoarsCount, roaredPostsCount }: Props) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <StatItem value={postsCount} label={t('profile.postsLabel')} />
      <View style={styles.divider} />
      <StatItem value={mediaCount} label={t('profile.mediaLabel')} />
      <View style={styles.divider} />
      <StatItem value={receivedRoarsCount} label={t('profile.receivedLabel')} />
      <View style={styles.divider} />
      <StatItem value={roaredPostsCount} label={t('profile.roarsGivenLabel')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  value: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
  label: {
    color: colors.muted,
    fontSize: font.size.xs,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
})
