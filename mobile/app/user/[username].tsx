import { useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { useUsersStore } from '@/state/users'
import { useSocialGraphStore } from '@/state/socialGraph'
import { usePostsStore } from '@/state/posts'
import { SocialPostCard, Post } from '@/components/feed/SocialPostCard'
import { colors, spacing, font, radius } from '@/lib/theme'

function formatCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return String(n)
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const router = useRouter()
  const { t } = useTranslation()

  const user = useUsersStore((s) => s.getUserByUsername(username))
  const isFollowing = useSocialGraphStore((s) => s.followingUsernames.includes(username))
  const { follow, unfollow } = useSocialGraphStore()
  const { posts, toggleRoar } = usePostsStore()

  const userPosts = useMemo(
    () => posts.filter((p) => p.username === username),
    [posts, username],
  )

  const displayedFollowers = (user?.followersCount ?? 0) + (isFollowing ? 1 : 0)

  function handleFollowToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (isFollowing) {
      unfollow(username)
    } else {
      follow(username)
    }
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={s.notFound}>
          <Ionicons name="person-outline" size={48} color={colors.border} />
          <Text style={s.notFoundTitle}>{t('social.notFound')}</Text>
          <Text style={s.notFoundSub}>@{username}</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ── Profile header ─────────────────────────────────────────────────────────
  const ListHeader = useCallback(
    () => (
      <>
        {/* Cover */}
        <View style={s.cover}>
          <View style={s.glowRight} />
          <View style={s.glowLeft} />
          <View style={s.coverFade} />
        </View>

        {/* Avatar + Follow button */}
        <View style={s.actionBar}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user.avatarInitial}</Text>
            </View>
          </View>
          <View style={s.spacer} />
          <TouchableOpacity
            style={[s.followBtn, isFollowing && s.followingBtn]}
            onPress={handleFollowToggle}
            activeOpacity={0.75}
          >
            {isFollowing && (
              <Ionicons name="checkmark" size={13} color={colors.muted} style={s.checkIcon} />
            )}
            <Text style={[s.followBtnText, isFollowing && s.followingBtnText]}>
              {isFollowing ? t('social.following') : t('social.follow')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.displayName}>{user.displayName}</Text>
          <Text style={s.username}>@{user.username}</Text>
          {!!user.bio && <Text style={s.bio}>{user.bio}</Text>}
          <View style={s.chips}>
            <View style={s.chip}>
              <Text style={s.chipText}>{user.nationalTeam}</Text>
            </View>
            <View style={s.chip}>
              <Text style={s.chipText}>❤️ {user.favoriteClub}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statValue}>{formatCount(displayedFollowers)}</Text>
            <Text style={s.statLabel}>{t('social.followers')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statValue}>{formatCount(user.followingCount)}</Text>
            <Text style={s.statLabel}>{t('social.followingLabel')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statValue}>{formatCount(user.postsCount)}</Text>
            <Text style={s.statLabel}>{t('social.postsLabel')}</Text>
          </View>
        </View>

        {/* Posts heading */}
        {userPosts.length > 0 && (
          <View style={s.postsHeader}>
            <Text style={s.postsHeaderText}>POSTS</Text>
          </View>
        )}
      </>
    ),
    [user, isFollowing, displayedFollowers, userPosts.length, t],
  )

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <SocialPostCard post={item} onToggleRoar={toggleRoar} onComment={() => {}} />
    ),
    [toggleRoar],
  )

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>@{user.username}</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList<Post>
        data={userPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyPosts}>
            <Text style={s.emptyPostsText}>{t('profile.emptyPosts')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },

  // Not found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  notFoundTitle: {
    color: colors.mutedLight,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    marginTop: spacing.sm,
  },
  notFoundSub: {
    color: colors.muted,
    fontSize: font.size.sm,
  },

  // Cover
  cover: {
    height: 130,
    backgroundColor: '#08031a',
    overflow: 'hidden',
  },
  glowRight: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.red,
    opacity: 0.1,
    top: -80,
    right: -60,
  },
  glowLeft: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#7b00ff',
    opacity: 0.06,
    bottom: -60,
    left: -40,
  },
  coverFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.dark,
    opacity: 0.55,
  },

  // Avatar + action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    marginTop: -47,
    paddingBottom: spacing.sm,
  },
  avatarRing: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.card,
    borderWidth: 2.5,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
  },
  spacer: { flex: 1 },

  // Follow button
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(232,0,45,0.5)',
    backgroundColor: 'rgba(232,0,45,0.08)',
    gap: 4,
  },
  followingBtn: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  followBtnText: {
    color: colors.red,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },
  followingBtnText: {
    color: colors.muted,
  },
  checkIcon: { marginRight: 1 },

  // Info
  info: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 3,
  },
  displayName: {
    color: colors.white,
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
  },
  username: {
    color: colors.muted,
    fontSize: font.size.sm,
    marginBottom: 2,
  },
  bio: {
    color: colors.text,
    fontSize: font.size.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(110, 106, 138, 0.5)',
    backgroundColor: colors.card,
  },
  chipText: {
    color: colors.mutedLight,
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    letterSpacing: 0.2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing.xs,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
  statLabel: {
    color: colors.muted,
    fontSize: font.size.xs,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  // Posts header
  postsHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  postsHeaderText: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 2,
  },

  // Empty posts
  emptyPosts: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyPostsText: {
    color: colors.muted,
    fontSize: font.size.sm,
  },
})
