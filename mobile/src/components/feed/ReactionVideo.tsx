import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Share } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ReactionWithProfile } from '@/hooks/useReactions'
import { colors, spacing, font, radius } from '@/lib/theme'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

type Props = {
  reaction: ReactionWithProfile
  isActive: boolean
  isLiked: boolean
  onLike: (id: string) => void
}

export function ReactionVideo({ reaction, isActive, isLiked, onLike }: Props) {
  const player = useVideoPlayer(reaction.video_url, (p) => {
    p.loop = true
    p.muted = false
  })

  useEffect(() => {
    if (isActive) {
      player.play()
    } else {
      player.pause()
      player.currentTime = 0
    }
  }, [isActive])

  const durationSec = Math.round(reaction.duration_ms / 1000)
  const username = reaction.profile?.username ?? `user_${reaction.user_id.slice(0, 6)}`
  const initial = username[0].toUpperCase()

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Gradiente simulado com camadas */}
      <View style={styles.gradientLayer1} pointerEvents="none" />
      <View style={styles.gradientLayer2} pointerEvents="none" />
      <View style={styles.gradientLayer3} pointerEvents="none" />

      {/* Ações laterais */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (isLiked) return
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            onLike(reaction.id)
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={30}
            color={isLiked ? colors.red : colors.white}
          />
          <Text style={[styles.actionCount, isLiked && { color: colors.red }]}>
            {reaction.score}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            await Share.share({
              message: `Veja minha reação ao vivo no ROAR 🔥\n${reaction.video_url}`,
              url: reaction.video_url,
            })
          }}
        >
          <Ionicons name="share-social-outline" size={27} color={colors.white} />
          <Text style={styles.actionCount}>share</Text>
        </TouchableOpacity>
      </View>

      {/* Info do autor */}
      <View style={styles.info}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>@{username}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{durationSec}s</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },

  // Gradiente simulado — 3 camadas progressivas
  gradientLayer1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#00000030',
  },
  gradientLayer2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#00000055',
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: '#00000075',
  },

  // Ações laterais (direita)
  actions: {
    position: 'absolute',
    right: spacing.md,
    bottom: 100,
    alignItems: 'center',
    gap: spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: colors.white,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Info do autor (rodapé esquerdo)
  info: {
    position: 'absolute',
    bottom: 90,
    left: spacing.lg,
    right: 80,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.md,
  },
  authorMeta: { flex: 1 },
  authorName: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  durationBadge: {
    backgroundColor: '#ffffff20',
    borderWidth: 1,
    borderColor: '#ffffff30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  durationText: {
    color: '#ffffffcc',
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
  },
})
