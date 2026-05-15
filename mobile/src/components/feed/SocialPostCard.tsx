import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { RoarButton } from './RoarButton'
import { colors, spacing, font, radius } from '@/lib/theme'

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

export type MockPost = {
  id: string
  user: { username: string; flag: string; initial: string }
  content: string
  imageUrl?: string | null
  matchLabel?: string | null
  isLive?: boolean
  roarCount: number
  commentCount: number
  repostCount: number
  isRoared: boolean
  createdAt: string
}

type Props = {
  post: MockPost
  onComment: (id: string) => void
}

export function SocialPostCard({ post, onComment }: Props) {
  return (
    <View style={styles.card}>
      {/* Avatar column */}
      <View style={styles.avatarCol}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.user.initial}</Text>
        </View>
      </View>

      {/* Content column */}
      <View style={styles.contentCol}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.username}>@{post.user.username}</Text>
          <Text style={styles.flag}> {post.user.flag}</Text>
          {post.isLive && <View style={styles.liveDot} />}
          <Text style={styles.dot}> · </Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>

        {post.matchLabel && (
          <Text style={styles.matchLabel} numberOfLines={1}>{post.matchLabel}</Text>
        )}

        {/* Text — fonte maior para posts curtos */}
        <Text style={[
          styles.content,
          post.content.length < 80 && styles.contentLarge,
        ]}>
          {post.content}
        </Text>

        {/* Imagem opcional */}
        {post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Ações */}
        <View style={styles.actions}>
          <RoarButton
            initialCount={post.roarCount}
            initialRoared={post.isRoared}
          />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onComment(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
            {post.commentCount > 0 && (
              <Text style={styles.actionCount}>{post.commentCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="repeat-outline" size={19} color={colors.muted} />
            {post.repostCount > 0 && (
              <Text style={styles.actionCount}>{post.repostCount}</Text>
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
    flexWrap: 'nowrap',
  },
  username: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },
  flag: { fontSize: 13 },
  dot: { color: colors.muted, fontSize: font.size.sm },
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
