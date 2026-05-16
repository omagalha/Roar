import { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useUsersStore } from '@/state/users'
import { useSocialGraphStore } from '@/state/socialGraph'
import { usePostsStore } from '@/state/posts'
import { SocialPostCard, Post } from '@/components/feed/SocialPostCard'
import { RoarUser } from '@/types/user'
import { colors, spacing, font, radius } from '@/lib/theme'

// ── UserRow ──────────────────────────────────────────────────────────────────

type UserRowProps = {
  user: RoarUser
  isFollowing: boolean
  onFollowToggle: () => void
  onPress: () => void
}

function UserRow({ user, isFollowing, onFollowToggle, onPress }: UserRowProps) {
  const { t } = useTranslation()
  return (
    <TouchableOpacity style={s.userRow} onPress={onPress} activeOpacity={0.75}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{user.avatarInitial}</Text>
      </View>

      <View style={s.userInfo}>
        <Text style={s.displayName} numberOfLines={1}>{user.displayName}</Text>
        <Text style={s.username}>@{user.username}</Text>
      </View>

      <TouchableOpacity
        style={[s.followBtn, isFollowing && s.followingBtn]}
        onPress={(e) => { e.stopPropagation?.(); onFollowToggle() }}
        activeOpacity={0.75}
        hitSlop={8}
      >
        <Text style={[s.followBtnText, isFollowing && s.followingBtnText]}>
          {isFollowing ? t('social.following') : t('social.follow')}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState('')

  const { searchUsers } = useUsersStore()
  const { followingUsernames, follow, unfollow } = useSocialGraphStore()
  const { posts, toggleRoar } = usePostsStore()

  const filteredUsers = useMemo(() => searchUsers(query), [query, searchUsers])

  const filteredPosts = useMemo(() => {
    if (!query.trim()) return []
    const lower = query.toLowerCase()
    return posts.filter(
      (p) =>
        p.text.toLowerCase().includes(lower) ||
        p.username.toLowerCase().includes(lower),
    )
  }, [query, posts])

  const hasQuery = query.trim().length > 0
  const hasResults = filteredUsers.length > 0 || filteredPosts.length > 0

  function handleFollowToggle(username: string) {
    if (followingUsernames.includes(username)) {
      unfollow(username)
    } else {
      follow(username)
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          style={s.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.muted}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        style={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Seção Pessoas */}
        {filteredUsers.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>
              {hasQuery ? t('search.people') : t('search.suggested')}
            </Text>
            {filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isFollowing={followingUsernames.includes(user.username)}
                onFollowToggle={() => handleFollowToggle(user.username)}
                onPress={() => router.push(`/user/${user.username}` as never)}
              />
            ))}
          </View>
        )}

        {/* Seção Posts */}
        {filteredPosts.length > 0 && (
          <View style={s.postsSection}>
            <Text style={s.sectionTitle}>{t('search.posts')}</Text>
            {filteredPosts.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                onToggleRoar={toggleRoar}
                onComment={() => {}}
              />
            ))}
          </View>
        )}

        {/* Estado vazio com query */}
        {hasQuery && !hasResults && (
          <View style={s.emptyState}>
            <Ionicons name="search-outline" size={40} color={colors.border} />
            <Text style={s.emptyTitle}>{t('search.noResults')}</Text>
            <Text style={s.emptyDesc}>"{query}"</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    color: colors.white,
    fontSize: font.size.sm,
  },

  scroll: { flex: 1 },

  sectionTitle: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  userInfo: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    color: colors.white,
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },
  username: {
    color: colors.muted,
    fontSize: font.size.xs,
  },

  // Follow button
  followBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(232,0,45,0.5)',
    backgroundColor: 'rgba(232,0,45,0.08)',
  },
  followingBtn: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  followBtnText: {
    color: colors.red,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 0.3,
  },
  followingBtnText: {
    color: colors.muted,
  },

  postsSection: {
    marginTop: spacing.xs,
  },

  // Empty
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.mutedLight,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    marginTop: spacing.sm,
  },
  emptyDesc: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontStyle: 'italic',
  },
})
