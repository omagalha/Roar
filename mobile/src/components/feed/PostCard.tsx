import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { PostWithProfile } from '@/hooks/useGlobalFeed'
import { colors, spacing, font, radius } from '@/lib/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const AVATAR_SIZE = 40
const CONTENT_WIDTH = SCREEN_WIDTH - spacing.md * 2 - AVATAR_SIZE - spacing.sm

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

const FLAG: Record<string, string> = {
  BR: '🇧🇷', AR: '🇦🇷', FR: '🇫🇷', DE: '🇩🇪',
  ES: '🇪🇸', PT: '🇵🇹', GB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', IT: '🇮🇹',
  US: '🇺🇸', MX: '🇲🇽', CO: '🇨🇴', UY: '🇺🇾',
}

type Props = {
  post: PostWithProfile
  isLiked: boolean
  onLike: (id: string) => void
  onComment: (id: string) => void
}

export function PostCard({ post, isLiked, onLike, onComment }: Props) {
  const username = post.profile?.username ?? 'anônimo'
  const initial = username[0].toUpperCase()

  const matchLabel = post.match
    ? `${FLAG[post.match.home_team.country] ?? '🏳️'} ${post.match.home_team.name} × ${post.match.away_team.name} ${FLAG[post.match.away_team.country] ?? '🏳️'}`
    : null

  return (
    <View style={styles.card}>
      {/* Avatar column */}
      <View style={styles.avatarCol}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      {/* Content column */}
      <View style={styles.contentCol}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>

        {matchLabel && (
          <Text style={styles.matchLabel} numberOfLines={1}>{matchLabel}</Text>
        )}

        {/* Text content */}
        {post.caption && (
          <Text style={styles.caption}>{post.caption}</Text>
        )}

        {/* Image (optional) */}
        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onComment(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={19} color={colors.muted} />
            {(post.comments_count ?? 0) > 0 && (
              <Text style={styles.actionCount}>{post.comments_count}</Text>
            )}
          </TouchableOpacity>

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
              size={19}
              color={isLiked ? colors.red : colors.muted}
            />
            {post.score > 0 && (
              <Text style={[styles.actionCount, isLiked && { color: colors.red }]}>
                {post.score}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={19} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  avatarCol: {
    width: AVATAR_SIZE + spacing.sm,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.md,
  },

  contentCol: {
    flex: 1,
    paddingBottom: spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },
  dot: { color: colors.muted, fontSize: font.size.sm },
  time: { color: colors.muted, fontSize: font.size.sm },

  matchLabel: {
    color: colors.muted,
    fontSize: font.size.xs,
    marginBottom: spacing.xs,
  },

  caption: {
    color: colors.text,
    fontSize: font.size.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },

  image: {
    width: CONTENT_WIDTH,
    height: CONTENT_WIDTH * 0.75,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: colors.muted,
    fontSize: font.size.sm,
  },
})
