import { View, Text, StyleSheet } from 'react-native'
import { useFanometro } from '@/hooks/useFanometro'
import { Skeleton } from '@/components/ui/Skeleton'
import { colors, spacing, font, radius } from '@/lib/theme'

type Props = { matchId: string }

export function Fanometro({ matchId }: Props) {
  const { entries, isLoading } = useFanometro(matchId)

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>FANÔMETRO</Text>
        <Skeleton height={48} borderRadius={radius.md} />
      </View>
    )
  }

  if (!entries.length) return null

  const max = entries[0].count

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FANÔMETRO</Text>
      {entries.map((entry, i) => {
        const pct = Math.max(8, Math.round((entry.count / max) * 100))
        const isTop = i === 0
        return (
          <View key={entry.teamId} style={styles.row}>
            <Text style={styles.rank}>{i + 1}</Text>
            <Text style={styles.flag}>{entry.flag}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${pct}%` }, isTop && styles.barTop]} />
              <Text style={styles.teamName}>{entry.teamName}</Text>
            </View>
            <Text style={styles.count}>{entry.count}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rank: {
    width: 16,
    fontSize: font.size.xs,
    color: colors.muted,
    fontWeight: font.weight.bold,
    textAlign: 'center',
  },
  flag: { fontSize: 18, width: 28 },
  barContainer: {
    flex: 1,
    height: 28,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
  barTop: { backgroundColor: '#E8002D30' },
  teamName: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.medium,
    paddingLeft: spacing.sm,
    zIndex: 1,
  },
  count: {
    fontSize: font.size.sm,
    color: colors.muted,
    fontWeight: font.weight.bold,
    minWidth: 24,
    textAlign: 'right',
  },
})
