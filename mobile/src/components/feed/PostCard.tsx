import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { PostWithProfile } from '@/hooks/useGlobalFeed'
import { colors, spacing, font, radius } from '@/lib/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.1

const FLAG: Record<string, string> = {
  BR: '🇧🇷', AR: '🇦🇷', FR: '🇫🇷', DE: '🇩🇪',
  ES: '🇪🇸', PT: '🇵🇹', GB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', IT: '🇮🇹',
  US: '🇺🇸', MX: '🇲🇽', CO: '🇨🇴', UY: '🇺🇾',
}

type Props = {
  post: PostWithProfile
  isLiked: boolean
  onLike: (id: string) => void
}

export function PostCard({ post, isLiked, onLike }: Props) {
  const username = post.profile?.username ?? 'anônimo'
  const initial = username[0].toUpperCase()

  const matchLabel = post.match
    ? `${FLAG[post.match.home_team.country] ?? '🏳️'} ${post.match.home_team.name} × ${post.match.away_team.name} ${FLAG[post.match.away_team.country] ?? '🏳️'}`
    : null

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.username}>@{username}</Text>
          {matchLabel && (
            <Text style={styles.matchLabel} numberOfLines={1}>{matchLabel}</Text>
          )}
        </View>
      </View>

      {/* Imagem */}
      <Image
        source={{ uri: post.image_url }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Ações */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (isLiked) return
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            onLike(post.id)
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={isLiked ? colors.red : colors.text}
          />
          <Text style={[styles.actionCount, isLiked && { color: colors.red }]}>
            {post.score}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Legenda */}
      {post.caption && (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>@{username}</Text>
          <Text style={styles.captionText}> {post.caption}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.sm },
  headerMeta: { flex: 1 },
  username: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.sm },
  matchLabel: { color: colors.muted, fontSize: font.size.xs, marginTop: 1 },

  image: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: colors.card,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: colors.text,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },

  captionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  captionUsername: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.sm },
  captionText: { color: colors.text, fontSize: font.size.sm, flex: 1 },
})
