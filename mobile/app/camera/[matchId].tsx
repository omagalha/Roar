import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import { useUpload } from '@/hooks/useUpload'
import { usePresence } from '@/hooks/usePresence'
import { colors, spacing, font, radius } from '@/lib/theme'

const MAX_DURATION = 10

type Phase = 'permission' | 'ready' | 'recording' | 'preview' | 'uploading' | 'done'

export default function CameraScreen() {
  const { matchId, eventId } = useLocalSearchParams<{ matchId: string; eventId?: string }>()
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const { uploadReaction, state: uploadState, progress } = useUpload()
  const { setRecording, setPosting } = usePresence(matchId)

  const cameraRef = useRef<CameraView>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [facing, setFacing] = useState<CameraType>('front')
  const [seconds, setSeconds] = useState(MAX_DURATION)
  const [videoUri, setVideoUri] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number>(0)

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
    setStartedAt(Date.now())
    setRecording(true)

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
    setRecording(false)
  }, [setRecording])

  useEffect(() => {
    if (phase === 'recording') return
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [phase])

  async function handlePost() {
    if (!videoUri) return
    setPhase('uploading')
    setPosting()

    const durationMs = Date.now() - startedAt
    const id = await uploadReaction({
      videoUri,
      matchId,
      eventId: eventId ?? null,
      durationMs,
    })

    if (id) {
      setPhase('done')
      setTimeout(() => router.replace(`/match/${matchId}`), 1200)
    } else {
      setPhase('preview')
    }
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

  if (phase === 'permission') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={56} color={colors.muted} />
          <Text style={styles.permTitle}>câmera necessária</Text>
          <Text style={styles.permDesc}>para gravar sua reação precisamos de acesso à câmera e ao microfone</Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>permitir acesso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.permCancel}>
            <Text style={styles.permCancelText}>agora não</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (phase === 'preview' && videoUri) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: '#000' }]}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />

        <View style={styles.previewOverlay}>
          <Text style={styles.previewLabel}>sua reação</Text>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscard} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={colors.text} />
            <Text style={styles.discardText}>regravar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postButton} onPress={handlePost} activeOpacity={0.85}>
            <Ionicons name="send" size={20} color={colors.white} />
            <Text style={styles.postText}>publicar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (phase === 'uploading' || phase === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {phase === 'done' ? (
            <>
              <Ionicons name="checkmark-circle" size={64} color={colors.green} />
              <Text style={styles.doneText}>reação publicada!</Text>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.red} size="large" />
              <Text style={styles.uploadingText}>publicando… {progress}%</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={[styles.safe, { backgroundColor: '#000' }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
      />

      {/* Header */}
      <SafeAreaView style={styles.cameraHeader}>
        <TouchableOpacity onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>

        {phase === 'recording' && (
          <View style={styles.timerChip}>
            <View style={styles.recDot} />
            <Text style={styles.timerText}>{seconds}s</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
          hitSlop={12}
        >
          <Ionicons name="camera-reverse-outline" size={28} color={colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Timer bar */}
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

      {/* Record button */}
      <View style={styles.cameraFooter}>
        {phase === 'ready' && (
          <Text style={styles.hint}>segure para gravar • {MAX_DURATION}s</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },

  // Permission
  permTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.white, textAlign: 'center' },
  permDesc: { fontSize: font.size.sm, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  permButton: { backgroundColor: colors.red, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  permButtonText: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.md },
  permCancel: { paddingVertical: spacing.sm },
  permCancelText: { color: colors.muted, fontSize: font.size.sm },

  // Camera
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00000080',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  timerText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold },
  timerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.red,
  },
  cameraFooter: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.md,
  },
  hint: { color: '#ffffffaa', fontSize: font.size.sm, letterSpacing: 0.5 },
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
    width: 32,
    height: 32,
    borderRadius: 8,
  },

  // Preview
  previewOverlay: {
    position: 'absolute',
    top: spacing.xxl + spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  previewLabel: {
    color: colors.white,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    backgroundColor: '#00000060',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  previewActions: {
    position: 'absolute',
    bottom: spacing.xxl,
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
    backgroundColor: '#ffffff20',
    borderWidth: 1,
    borderColor: '#ffffff30',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  discardText: { color: colors.text, fontWeight: font.weight.bold },
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
  postText: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.md },

  // Upload/Done
  doneText: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.white },
  uploadingText: { fontSize: font.size.md, color: colors.muted },
})
