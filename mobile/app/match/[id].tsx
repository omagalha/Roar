import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMatchRoom } from '@/hooks/useMatchRoom'
import { usePresence } from '@/hooks/usePresence'
import { useReactions } from '@/hooks/useReactions'
import { subscribeToMatch, unsubscribeFromMatch } from '@/lib/notifications'
import { GoalFlash } from '@/components/matches/GoalFlash'
import { EventRow } from '@/components/matches/EventRow'
import { Fanometro } from '@/components/matches/Fanometro'
import { LiveEvent } from '@/types/database'
import { colors, spacing, font, radius } from '@/lib/theme'

const FLAG: Record<string, string> = {
  BR: '🇧🇷', AR: '🇦🇷', FR: '🇫🇷', DE: '🇩🇪',
  ES: '🇪🇸', PT: '🇵🇹', GB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', IT: '🇮🇹',
  US: '🇺🇸', MX: '🇲🇽', CO: '🇨🇴', UY: '🇺🇾',
}

export default function MatchRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { match, events, isLoading, latestEvent } = useMatchRoom(id)
  const { count, recordingCount } = usePresence(id)
  const { reactions } = useReactions(id)

  const [goalEvent, setGoalEvent] = useState<LiveEvent | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const seenEventRef = useRef<string | null>(null)
  const pushTokenRef = useRef<string | null>(null)

  useEffect(() => {
    import('@/lib/notifications').then(async ({ registerForPushNotifications }) => {
      const token = await registerForPushNotifications()
      pushTokenRef.current = token
      if (token) {
        await subscribeToMatch(id, token)
        setSubscribed(true)
      }
    })

    return () => {
      if (pushTokenRef.current) {
        unsubscribeFromMatch(id)
      }
    }
  }, [id])

  useEffect(() => {
    if (!latestEvent) return
    if (latestEvent.event_type !== 'goal') return
    if (seenEventRef.current === latestEvent.id) return

    seenEventRef.current = latestEvent.id
    setGoalEvent(latestEvent)

    setTimeout(() => {
      router.push(`/camera/${id}`)
    }, 2500)
  }, [latestEvent])

  const isLive = match?.status === 'LIVE' || match?.status === 'HT'

  if (isLoading || !match) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.red} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {goalEvent && (
        <GoalFlash event={goalEvent} onDismiss={() => setGoalEvent(null)} />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {isLive && (
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>AO VIVO</Text>
            </View>
          )}
        </View>

        <View style={styles.watchersChip}>
          <Ionicons name="eye-outline" size={14} color={colors.muted} />
          <Text style={styles.watchersText}>{count}</Text>
        </View>
      </View>

      <View style={styles.scoreSection}>
        <View style={styles.teamBlock}>
          <Text style={styles.flag}>
            {FLAG[match.home_team.country] ?? '🏳️'}
          </Text>
          <Text style={styles.teamName} numberOfLines={2}>
            {match.home_team.name}
          </Text>
        </View>

        <View style={styles.scoreBlock}>
          {isLive || match.status === 'FT' ? (
            <>
              <Text style={styles.scoreText}>
                {match.home_goals}
                <Text style={styles.scoreSep}> × </Text>
                {match.away_goals}
              </Text>
              {match.status === 'HT' && (
                <Text style={styles.htLabel}>INTERVALO</Text>
              )}
              {match.status === 'FT' && (
                <Text style={styles.ftLabel}>ENCERRADO</Text>
              )}
            </>
          ) : (
            <Text style={styles.vsText}>vs</Text>
          )}
        </View>

        <View style={[styles.teamBlock, styles.teamBlockRight]}>
          <Text style={styles.flag}>
            {FLAG[match.away_team.country] ?? '🏳️'}
          </Text>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={2}>
            {match.away_team.name}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.eventsScroll}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
      >
        {events.length === 0 ? (
          <Text style={styles.noEvents}>aguardando eventos...</Text>
        ) : (
          events.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </ScrollView>

      <Fanometro matchId={id} />

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {isLive && (
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => router.push(`/camera/${id}`)}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={20} color={colors.white} />
              <Text style={styles.cameraButtonText}>gravar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.feedButton}
            onPress={() => router.push(`/feed/${id}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle-outline" size={20} color={colors.text} />
            <Text style={styles.feedButtonText}>
              {reactions.length > 0 ? `${reactions.length} reações` : 'reações'}
            </Text>
          </TouchableOpacity>
        </View>
        {subscribed && (
          <View style={styles.pushChip}>
            <Ionicons name="notifications" size={14} color={colors.green} />
            <Text style={styles.pushText}>notificando gols</Text>
          </View>
        )}
        {recordingCount > 0 && (
          <View style={styles.pushChip}>
            <Ionicons name="radio-button-on" size={14} color={colors.red} />
            <Text style={styles.recordingText}>
              {recordingCount} gravando agora
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8002D20',
    borderWidth: 1,
    borderColor: '#E8002D40',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red },
  liveText: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.red, letterSpacing: 1 },
  watchersChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchersText: { fontSize: font.size.sm, color: colors.muted },

  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamBlock: { flex: 1, alignItems: 'flex-start', gap: spacing.sm },
  teamBlockRight: { alignItems: 'flex-end' },
  flag: { fontSize: 40 },
  teamName: { fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.medium, lineHeight: 20 },
  teamNameRight: { textAlign: 'right' },
  scoreBlock: { paddingHorizontal: spacing.md, alignItems: 'center', gap: spacing.xs },
  scoreText: { fontSize: 44, fontWeight: font.weight.bold, color: colors.white, letterSpacing: 2 },
  scoreSep: { color: colors.muted, fontWeight: font.weight.regular },
  htLabel: { fontSize: font.size.xs, color: colors.gold, fontWeight: font.weight.bold, letterSpacing: 1 },
  ftLabel: { fontSize: font.size.xs, color: colors.muted, fontWeight: font.weight.bold, letterSpacing: 1 },
  vsText: { fontSize: font.size.lg, color: colors.muted },

  eventsScroll: { flex: 1 },
  eventsList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  noEvents: { color: colors.muted, fontSize: font.size.sm, textAlign: 'center', marginTop: spacing.xl },

  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cameraButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  cameraButtonText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold, letterSpacing: 1 },
  feedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  feedButtonText: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.bold },
  pushChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pushText: { fontSize: font.size.xs, color: colors.green },
  recordingText: { fontSize: font.size.xs, color: colors.red },
})
