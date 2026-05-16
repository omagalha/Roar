import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import { useLiveMatchesStore } from '@/state/liveMatches'
import { colors, spacing, font, radius } from '@/lib/theme'

const MAX_DURATION = 10

type Phase = 'permission' | 'ready' | 'recording' | 'preview' | 'publishing' | 'done'

export default function CameraScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const match = useLiveMatchesStore((s) => s.matches.find((m) => m.id === matchId))

  const cameraRef = useRef<CameraView>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [facing, setFacing] = useState<CameraType>('front')
  const [seconds, setSeconds] = useState(MAX_DURATION)
  const [videoUri, setVideoUri] = useState<string | null>(null)

  const timerProgress = useRef(new Animated.Value(1)).current
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const player = useVideoPlayer(videoUri ?? '', (p) => {
    p.loop = true
    if (videoUri) p.play()
  })

  useEffect(() => {
    if (!permission) return
    if (!permission.granted) setPhase('permission')
    else setPhase('ready')
  }, [permission])

  function startRecording() {
    if (!cameraRef.current) return
    setPhase('recording')
    setSeconds(MAX_DURATION)

    Animated.timing(timerProgress, {
      toValue: 0,
      duration: MAX_DURATION * 1000,
      useNativeDriver: false,
    }).start()

    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          stopRecording()
          return 0
        }
        return s - 1
      })
    }, 1000)

    cameraRef.current.recordAsync({ maxDuration: MAX_DURATION }).then((result) => {
      if (result?.uri) {
        setVideoUri(result.uri)
        setPhase('preview')
      }
    })
  }

  const stopRecording = useCallback(() => {
    cameraRef.current?.stopRecording()
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (phase === 'recording') return
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [phase])

  async function handlePost() {
    if (!videoUri) return
    setPhase('publishing')
    await new Promise((r) => setTimeout(r, 1000))
    setPhase('done')
    setTimeout(() => router.replace(`/match/${matchId}`), 1400)
  }

  function handleDiscard() {
    setVideoUri(null)
    timerProgress.setValue(1)
    setPhase('ready')
  }

  function handleClose() {
    if (phase === 'recording') stopRecording()
    router.replace(`/match/${matchId}`)
  }

  const scoreLabel = match
    ? match.status === 'upcoming'
      ? `${match.homeTeam.flag} ${match.homeTeam.shortName} × ${match.awayTeam.shortName} ${match.awayTeam.flag}`
      : `${match.homeTeam.flag} ${match.homeTeam.shortName} ${match.homeScore}–${match.awayScore} ${match.awayTeam.shortName} ${match.awayTeam.flag}`
    : null

  // ── Permission ───────────────────────────────────────────────────────────────

  if (phase === 'permission') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={56} color={colors.muted} />
          <Text style={styles.permTitle}>Câmera necessária</Text>
          <Text style={styles.permDesc}>
            Para gravar sua comemoração precisamos de acesso à câmera e ao microfone.
          </Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Permitir acesso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.permCancel}>
            <Text style={styles.permCancelText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Preview ──────────────────────────────────────────────────────────────────

  if (phase === 'preview' && videoUri) {
    return (
      <View style={styles.blackFill}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Top gradient overlay + header */}
        <View style={[styles.previewTopOverlay, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.previewHeaderLabel}>COMEMORAÇÃO</Text>
          {scoreLabel && <Text style={styles.previewHeaderScore}>{scoreLabel}</Text>}
        </View>

        {/* Action buttons */}
        <View style={[styles.previewActions, { bottom: insets.bottom + spacing.lg }]}>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscard} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color={colors.text} />
            <Text style={styles.discardText}>Regravar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postButton} onPress={handlePost} activeOpacity={0.85}>
            <Ionicons name="send" size={17} color={colors.white} />
            <Text style={styles.postText}>Publicar comemoração</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Publishing / Done ────────────────────────────────────────────────────────

  if (phase === 'publishing' || phase === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {phase === 'done' ? (
            <>
              <Ionicons name="checkmark-circle" size={64} color={colors.green} />
              <Text style={styles.doneText}>Comemoração publicada!</Text>
              {scoreLabel && <Text style={styles.doneScore}>{scoreLabel}</Text>}
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.red} size="large" />
              <Text style={styles.publishingText}>Publicando…</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    )
  }

  // ── Camera (ready / recording) ───────────────────────────────────────────────

  return (
    <View style={styles.blackFill}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      {/* Progress bar */}
      {phase === 'recording' && (
        <Animated.View
          style={[
            styles.timerBar,
            {
              width: timerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      )}

      {/* Header */}
      <View style={[styles.cameraHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {phase === 'recording' ? (
            <View style={styles.recChip}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC</Text>
              <Text style={styles.timerText}>{seconds}s</Text>
            </View>
          ) : (
            <Text style={styles.headerTitle}>COMEMORAÇÃO</Text>
          )}
          {scoreLabel && <Text style={styles.headerScore}>{scoreLabel}</Text>}
        </View>

        <TouchableOpacity
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
          hitSlop={12}
          disabled={phase === 'recording'}
        >
          <Ionicons
            name="camera-reverse-outline"
            size={28}
            color={phase === 'recording' ? '#ffffff44' : colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* Pre-recording overlay */}
      {phase === 'ready' && (
        <View style={styles.readyOverlay} pointerEvents="none">
          <Text style={styles.readyTitle}>Mostre sua reação</Text>
          <Text style={styles.readySubtitle}>A torcida está rugindo</Text>
        </View>
      )}

      {/* Record button */}
      <View style={[styles.cameraFooter, { bottom: insets.bottom + spacing.xl }]}>
        {phase === 'ready' && (
          <Text style={styles.hint}>toque para gravar · {MAX_DURATION}s</Text>
        )}
        <TouchableOpacity
          style={styles.recordButton}
          onPress={phase === 'ready' ? startRecording : stopRecording}
          activeOpacity={0.9}
        >
          <View style={[styles.recordInner, phase === 'recording' && styles.recordingInner]} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  blackFill: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },

  // Permission
  permTitle: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  permDesc: {
    fontSize: font.size.sm,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  permButton: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  permButtonText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.md,
  },
  permCancel: { paddingVertical: spacing.sm },
  permCancelText: { color: colors.muted, fontSize: font.size.sm },

  // Camera header
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.white,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerScore: {
    color: '#ffffffbb',
    fontSize: font.size.xs,
    letterSpacing: 0.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // REC chip
  recChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00000088',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red },
  recText: {
    color: colors.red,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
  },
  timerText: {
    color: colors.white,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },

  // Progress bar
  timerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.red,
  },

  // Pre-recording overlay
  readyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readyTitle: {
    color: colors.white,
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    letterSpacing: 0.3,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  readySubtitle: {
    color: '#ffffffaa',
    fontSize: font.size.sm,
    letterSpacing: 0.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Camera footer / record button
  cameraFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.md,
  },
  hint: {
    color: '#ffffffaa',
    fontSize: font.size.xs,
    letterSpacing: 0.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.red,
  },
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },

  // Preview
  previewTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.lg,
    backgroundColor: '#00000055',
    gap: 6,
  },
  previewHeaderLabel: {
    color: colors.white,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  previewHeaderScore: {
    color: '#ffffffbb',
    fontSize: font.size.xs,
    letterSpacing: 0.5,
  },
  previewActions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  discardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#ffffff18',
    borderWidth: 1,
    borderColor: '#ffffff28',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  discardText: {
    color: colors.text,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },
  postButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  postText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },

  // Publishing / Done
  doneText: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  doneScore: {
    fontSize: font.size.sm,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  publishingText: {
    fontSize: font.size.md,
    color: colors.muted,
  },
})
