import { useEffect, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { useLiveMatchesStore } from '@/state/liveMatches'
import { useProfileStore } from '@/state/profile'
import { useMatchChatStore } from '@/state/matchChat'
import { MatchStatusPill } from '@/components/matches/MatchStatusPill'
import { Match } from '@/types/match'
import { colors, spacing, font, radius } from '@/lib/theme'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFanSupport(match: Match): { home: number; away: number } {
  if (match.homeScore > match.awayScore) return { home: 62, away: 38 }
  if (match.awayScore > match.homeScore) return { home: 38, away: 62 }
  const swing = match.roarCount % 21 - 10
  return { home: 50 + swing, away: 50 - swing }
}

type MockEvent = { id: string; time: string; description: string }

function getMockEvents(match: Match): MockEvent[] {
  const events: MockEvent[] = []
  if (match.homeScore > 0)
    events.push({ id: 'e1', time: "23'", description: `Gol de ${match.homeTeam.name} ${match.homeTeam.flag}` })
  if (match.awayScore > 0)
    events.push({ id: 'e2', time: "41'", description: `Gol de ${match.awayTeam.name} ${match.awayTeam.flag}` })
  if (match.minute && match.minute > 30)
    events.push({ id: 'e3', time: `${Math.floor(match.minute * 0.55)}'`, description: 'Defesa importante 🧤' })
  if (events.length === 0)
    events.push({ id: 'e0', time: '--', description: 'Aguardando eventos...' })
  return events
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.title}>{title}</Text>
      {children}
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
})

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MatchRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const match = useLiveMatchesStore((s) => s.matches.find((m) => m.id === id))
  const profile = useProfileStore((s) => s.profile)
  const { getMessages, addMessage, seedMessages } = useMatchChatStore()

  const initialSupport = match ? getFanSupport(match) : { home: 50, away: 50 }
  const [fanHome, setFanHome] = useState(initialSupport.home)
  const [fanAway, setFanAway] = useState(initialSupport.away)
  const [hasRoared, setHasRoared] = useState(false)
  const [chatText, setChatText] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const chatScrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (match) {
      seedMessages(match.id, match.homeTeam.name, match.awayTeam.name)
    }
  }, [match?.id])

  // ── Not found ──
  if (!match) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Ionicons name="football-outline" size={48} color={colors.border} />
          <Text style={styles.notFoundText}>{t('matches.notFound')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>{t('matches.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  const nationalTeamLower = profile.nationalTeam.toLowerCase()
  const matchesAway = nationalTeamLower.length > 0 && nationalTeamLower.includes(match.awayTeam.name.toLowerCase())
  const matchesHome = nationalTeamLower.length > 0 && nationalTeamLower.includes(match.homeTeam.name.toLowerCase())
  const roarForHome = matchesHome || !matchesAway
  const roarTeam = roarForHome ? match.homeTeam : match.awayTeam

  const roarPhrase =
    match.homeScore > match.awayScore
      ? `${match.homeTeam.name} está rugindo mais alto.`
      : match.awayScore > match.homeScore
        ? `${match.awayTeam.name} está rugindo mais alto.`
        : 'As torcidas estão rugindo juntas.'

  const messages = getMessages(match.id)
  const events = getMockEvents(match)

  function handleRoar() {
    if (hasRoared) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (roarForHome) {
      setFanHome((h) => Math.min(h + 2, 98))
      setFanAway((a) => Math.max(a - 2, 2))
    } else {
      setFanAway((a) => Math.min(a + 2, 98))
      setFanHome((h) => Math.max(h - 2, 2))
    }
    setHasRoared(true)
  }

  function handleSend() {
    const trimmed = chatText.trim()
    if (!trimmed) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const username = profile.username || 'anônimo'
    const avatarInitial = profile.avatarInitial || username[0]?.toUpperCase() || '?'
    const teamFlag =
      profile.nationalTeam
        ? match.homeTeam.name.toLowerCase() === profile.nationalTeam.toLowerCase()
          ? match.homeTeam.flag
          : match.awayTeam.name.toLowerCase() === profile.nationalTeam.toLowerCase()
            ? match.awayTeam.flag
            : undefined
        : undefined
    addMessage(match.id, trimmed, { username, avatarInitial, teamFlag })
    setChatText('')
  }

  function handleCTA() {
    if (isLive) router.push(`/camera/${id}` as never)
    else if (isFinished) router.push(`/feed/${id}` as never)
  }

  const ctaLabel = isLive
    ? t('matches.recordCelebration')
    : isFinished
      ? t('matches.bestRoars')
      : t('matches.setAlert')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <MatchStatusPill status={match.status} />
            {isLive && match.minute !== undefined && (
              <Text style={styles.headerMinute}>{match.minute}'</Text>
            )}
          </View>

          <View style={styles.onlineChip}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>
              {formatCount(match.onlineCount)} {t('matches.online')}
            </Text>
          </View>
        </View>

        {/* ── Score hero ── */}
        <View style={[styles.scoreSection, isLive && styles.scoreSectionLive]}>
          <View style={styles.teamBlock}>
            <Text style={styles.flag}>{match.homeTeam.flag}</Text>
            <Text style={styles.teamName}>{match.homeTeam.name}</Text>
          </View>

          <View style={styles.scoreBlock}>
            {match.status !== 'upcoming' ? (
              <Text style={[styles.scoreText, isLive && styles.scoreTextLive]}>
                {match.homeScore}
                <Text style={styles.scoreSep}> — </Text>
                {match.awayScore}
              </Text>
            ) : (
              <Text style={styles.vsText}>vs</Text>
            )}
          </View>

          <View style={[styles.teamBlock, styles.teamBlockRight]}>
            <Text style={styles.flag}>{match.awayTeam.flag}</Text>
            <Text style={[styles.teamName, styles.teamNameRight]}>{match.awayTeam.name}</Text>
          </View>
        </View>

        {/* ── Roar phrase ── */}
        {match.status !== 'upcoming' && (
          <View style={styles.phraseRow}>
            <Text style={styles.phraseText}>{roarPhrase}</Text>
          </View>
        )}

        {/* ── Meta row ── */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            🔥 {formatCount(match.roarCount)} {t('matches.roars')}
          </Text>
        </View>

        {/* ── Scrollable sections ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Rugidômetro */}
          <SectionCard title={t('matches.fanMeter')}>
            <View style={styles.fanRow}>
              <Text style={styles.fanTeam}>{match.homeTeam.flag} {match.homeTeam.shortName}</Text>
              <Text style={styles.fanPct}>{fanHome}%</Text>
            </View>
            <View style={styles.fanBar}>
              <View style={[styles.fanBarHome, { flex: fanHome }]} />
              <View style={[styles.fanBarAway, { flex: fanAway }]} />
            </View>
            <View style={styles.fanRow}>
              <Text style={styles.fanTeam}>{match.awayTeam.flag} {match.awayTeam.shortName}</Text>
              <Text style={styles.fanPct}>{fanAway}%</Text>
            </View>

            <TouchableOpacity
              style={[styles.roarButton, hasRoared && styles.roarButtonDone]}
              onPress={handleRoar}
              activeOpacity={hasRoared ? 1 : 0.75}
              disabled={hasRoared}
            >
              <Text style={[styles.roarButtonText, hasRoared && styles.roarButtonTextDone]}>
                {hasRoared
                  ? `✓ Você rugiu pelo ${roarTeam.name} ${roarTeam.flag}`
                  : `🦁 Rugir pelo ${roarTeam.name} ${roarTeam.flag}`}
              </Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Torcida ao vivo */}
          <View style={styles.liveChatCard}>
            <Text style={styles.liveChatTitle}>{t('matches.liveChants')}</Text>

            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollContent}
              showsVerticalScrollIndicator
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg, i) => (
                <View key={msg.id} style={[styles.commentItem, i > 0 && styles.commentItemBorder]}>
                  <Text style={styles.commentHandle}>
                    @{msg.username}{msg.teamFlag ? ` ${msg.teamFlag}` : ''}
                  </Text>
                  <Text style={styles.commentText}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatText}
                onChangeText={setChatText}
                placeholder={t('matches.chatPlaceholder')}
                placeholderTextColor={colors.mutedLight}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, !chatText.trim() && styles.chatSendBtnDisabled]}
                onPress={handleSend}
                disabled={!chatText.trim()}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="send"
                  size={15}
                  color={chatText.trim() ? colors.red : colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Melhores momentos */}
          <SectionCard title={t('matches.highlights')}>
            {events.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <Text style={styles.eventTime}>{e.time}</Text>
                <Text style={styles.eventDesc}>{e.description}</Text>
              </View>
            ))}
          </SectionCard>
        </ScrollView>

        {/* ── Footer CTA ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.ctaButton,
              !isLive && !isFinished && styles.ctaButtonOutline,
            ]}
            onPress={handleCTA}
            activeOpacity={0.85}
            disabled={!isLive && !isFinished}
          >
            {isLive && (
              <Ionicons name="camera" size={18} color={colors.white} />
            )}
            <Text style={[styles.ctaText, !isLive && !isFinished && styles.ctaTextMuted]}>
              {ctaLabel}
            </Text>
          </TouchableOpacity>

          {(isLive || isFinished) && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push(`/feed/${id}` as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="play-circle-outline" size={18} color={colors.text} />
              <Text style={styles.secondaryText}>{t('matches.viewReactions')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  keyboardAvoid: { flex: 1 },

  /* Not found */
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  notFoundText: {
    color: colors.mutedLight,
    fontSize: font.size.md,
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  headerMinute: {
    color: colors.red,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },
  onlineChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  onlineText: { fontSize: font.size.xs, color: colors.mutedLight },

  /* Score */
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreSectionLive: {
    backgroundColor: '#0f0a16',
  },
  teamBlock: { flex: 1, alignItems: 'flex-start', gap: spacing.sm },
  teamBlockRight: { alignItems: 'flex-end' },
  flag: { fontSize: 52, lineHeight: 60 },
  teamName: {
    fontSize: font.size.md,
    color: colors.white,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
  },
  teamNameRight: { textAlign: 'right' },
  scoreBlock: { paddingHorizontal: spacing.sm, alignItems: 'center' },
  scoreText: {
    fontSize: 46,
    fontWeight: font.weight.bold,
    color: colors.text,
    letterSpacing: 2,
  },
  scoreTextLive: { color: colors.white },
  scoreSep: { color: colors.muted, fontSize: 36 },
  vsText: { fontSize: font.size.xl, color: colors.border, letterSpacing: 4 },

  /* Roar phrase */
  phraseRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  phraseText: {
    color: colors.mutedLight,
    fontSize: font.size.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  /* Meta */
  metaRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaText: { color: colors.muted, fontSize: font.size.xs },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },

  /* Fan meter */
  fanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fanTeam: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.bold },
  fanPct: { color: colors.mutedLight, fontSize: font.size.sm },
  fanBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.border,
    gap: 2,
  },
  fanBarHome: { backgroundColor: colors.red, borderRadius: 3 },
  fanBarAway: { backgroundColor: colors.border, borderRadius: 3 },

  roarButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(232,0,45,0.4)',
    backgroundColor: 'rgba(232,0,45,0.08)',
    alignItems: 'center',
  },
  roarButtonText: {
    color: colors.red,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    letterSpacing: 0.5,
  },
  roarButtonDone: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  roarButtonTextDone: {
    color: colors.mutedLight,
  },

  /* Chat messages */
  commentItem: {
    paddingVertical: spacing.sm,
    gap: 3,
  },
  commentItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentHandle: {
    color: colors.red,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
  },
  commentText: {
    color: colors.white,
    fontSize: font.size.sm,
    lineHeight: 18,
  },

  /* Live chat card */
  liveChatCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  liveChatTitle: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  chatScroll: {
    maxHeight: 220,
  },
  chatScrollContent: {
    paddingBottom: spacing.xs,
  },

  /* Chat input */
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    color: colors.white,
    fontSize: font.size.sm,
  },
  chatSendBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(232,0,45,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,0,45,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },

  /* Events */
  eventRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  eventTime: {
    color: colors.red,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    width: 36,
  },
  eventDesc: { color: colors.text, fontSize: font.size.sm, flex: 1 },

  /* Footer */
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  ctaButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaText: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    letterSpacing: 0.5,
  },
  ctaTextMuted: { color: colors.mutedLight },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  secondaryText: {
    color: colors.text,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },
})
