import { View, Text, StyleSheet } from 'react-native'
import { LiveEvent } from '@/types/database'
import { colors, font, spacing, radius } from '@/lib/theme'

type Props = { event: LiveEvent }

const EVENT_CONFIG = {
  goal:        { emoji: '⚽', color: colors.red,   label: 'GOL' },
  kickoff:     { emoji: '🏁', color: colors.muted, label: 'INÍCIO' },
  halftime:    { emoji: '⏱️', color: colors.gold,  label: 'INTERVALO' },
  fulltime:    { emoji: '🔚', color: colors.muted, label: 'FIM' },
  reaction_created: { emoji: '🎬', color: colors.cyan, label: 'REAÇÃO' },
} as const

export function EventRow({ event }: Props) {
  const cfg = EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG] ?? {
    emoji: '•', color: colors.muted, label: event.event_type.toUpperCase(),
  }

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: cfg.color + '30', borderColor: cfg.color + '60' }]}>
        <Text style={styles.emoji}>{cfg.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
        {event.team_name ? (
          <Text style={styles.team}>{event.team_name}</Text>
        ) : null}
      </View>
      {event.minute ? (
        <Text style={styles.minute}>{event.minute}'</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 16,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
  },
  team: {
    fontSize: font.size.sm,
    color: colors.text,
  },
  minute: {
    fontSize: font.size.sm,
    color: colors.muted,
    fontWeight: font.weight.medium,
  },
})
