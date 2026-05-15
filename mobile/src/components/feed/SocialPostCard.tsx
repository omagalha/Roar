import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { RoarButton } from './RoarButton'
import { Post } from '@/types/post'
import { colors, spacing, font, radius } from '@/lib/theme'

export type { Post }

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const AVATAR_SIZE = 42
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

type Props = {
  post: Post
  onToggleRoar: (id: string) => void
  onComment: (id: string) => void
}

export function SocialPostCard({ post, onToggleRoar, onComment }: Props) {
  return (
    <View style={styles.card}>
      {/* Avatar column */}
      <View style={styles.avatarCol}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.avatarInitial}</Text>
        </View>
      </View>

      {/* Content column */}
      <View style={styles.contentCol}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.username}>@{post.username}</Text>
          {post.teamFlag ? <Text style={styles.flag}> {post.teamFlag}</Text> : null}
          {post.isLive && <View style={styles.liveDot} />}
          <Text style={styles.sep}> · </Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>

        {post.matchLabel && (
          <Text style={styles.matchLabel} numberOfLines={1}>{post.matchLabel}</Text>
        )}

        <Text style={[styles.content, post.text.length < 80 && styles.contentLarge]}>
          {post.text}
        </Text>

        {post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <RoarButton
            count={post.roarCount}
            isRoared={post.isRoared}
            onPress={() => onToggleRoar(post.id)}
          />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onComment(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
            {post.commentsCount > 0 && (
              <Text style={styles.actionCount}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="repeat-outline" size={19} color={colors.muted} />
            {post.repostsCount > 0 && (
              <Text style={styles.actionCount}>{post.repostsCount}</Text>
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: 3,
  },
  username: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },
  flag: { fontSize: 13 },
  sep: { color: colors.muted, fontSize: font.size.sm },
  time: { color: colors.muted, fontSize: font.size.sm },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.red,
    marginLeft: 5,
  },

  matchLabel: {
    color: colors.muted,
    fontSize: font.size.xs,
    marginBottom: spacing.xs,
  },

  content: {
    color: colors.text,
    fontSize: font.size.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  contentLarge: {
    fontSize: font.size.lg,
    lineHeight: 26,
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
    alignItems: 'center',
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
