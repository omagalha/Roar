import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { LiveEvent, GoalPayload } from '@/types/database'
import { colors, font, spacing } from '@/lib/theme'

type Props = {
  event: LiveEvent
  onDismiss: () => void
}

export function GoalFlash({ event, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.8)).current

  const payload = event.payload as unknown as GoalPayload
  const score = payload?.score

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(onDismiss)
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.emoji}>⚽</Text>
        <Text style={styles.title}>GOOOL!</Text>
        <Text style={styles.team}>{event.team_name}</Text>
        {score && (
          <Text style={styles.score}>
            {payload.teams?.home} {score.home} × {score.away} {payload.teams?.away}
          </Text>
        )}
        {event.minute && (
          <Text style={styles.minute}>{event.minute}'</Text>
        )}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8002D18',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.red,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 260,
    shadowColor: colors.red,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 40,
    fontWeight: font.weight.bold,
    color: colors.white,
    letterSpacing: 6,
  },
  team: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.red,
  },
  score: {
    fontSize: font.size.md,
    color: colors.text,
    textAlign: 'center',
  },
  minute: {
    fontSize: font.size.sm,
    color: colors.muted,
  },
})
