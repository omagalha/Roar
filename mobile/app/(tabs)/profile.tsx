import { useState, useCallback, useMemo } from 'react'
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Ionicons } from '@expo/vector-icons'
import { SocialPostCard, Post } from '@/components/feed/SocialPostCard'
import { CommentsSheet } from '@/components/feed/CommentsSheet'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileTabs, ProfileTab } from '@/components/profile/ProfileTabs'
import { useProfileStore } from '@/state/profile'
import { usePostsStore } from '@/state/posts'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'
import { colors, spacing, font } from '@/lib/theme'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile } = useProfileStore()
  const posts = usePostsStore((s) => s.posts)
  const toggleRoar = usePostsStore((s) => s.toggleRoar)
  const { signOut } = useAuthStore()

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [commentPostId, setCommentPostId] = useState<string | null>(null)

  const myPosts = useMemo(
    () => posts.filter((p) => p.username === profile.username),
    [posts, profile.username],
  )
  const mediaPosts = useMemo(
    () => myPosts.filter((p) => !!p.imageUrl),
    [myPosts],
  )
  const roaredPosts = useMemo(
    () => posts.filter((p) => p.isRoared),
    [posts],
  )
  const receivedRoars = useMemo(
    () => myPosts.reduce((sum, p) => sum + p.roarCount, 0),
    [myPosts],
  )

  const visiblePosts =
    activeTab === 'media' ? mediaPosts
    : activeTab === 'roars' ? roaredPosts
    : myPosts

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <SocialPostCard
        post={item}
        onToggleRoar={toggleRoar}
        onComment={setCommentPostId}
      />
    ),
    [toggleRoar],
  )

  function handleSignOut() {
    Alert.alert(
      t('auth.signOut'),
      t('auth.signOutConfirm'),
      [
        { text: t('post.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            signOut()
          },
        },
      ],
    )
  }

  const emptyMessage =
    activeTab === 'media' ? t('profile.emptyMedia')
    : activeTab === 'roars' ? t('profile.emptyRoars')
    : t('profile.emptyPosts')

  // Header renderizado como função-componente para que o FlatList sempre
  // receba referências frescas — evita closures obsoletas no Hermes.
  const ListHeader = useCallback(
    () => (
      <>
        <ProfileHeader
          profile={profile}
          onEditPress={() => router.push('/edit-profile')}
        />
        <ProfileStats
          postsCount={myPosts.length}
          mediaCount={mediaPosts.length}
          receivedRoarsCount={receivedRoars}
          roaredPostsCount={roaredPosts.length}
        />
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, myPosts.length, mediaPosts.length, receivedRoars, roaredPosts.length, activeTab],
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>@{profile.username}</Text>
        <TouchableOpacity onPress={handleSignOut} hitSlop={12}>
          <Ionicons name="log-out-outline" size={22} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <FlatList<Post>
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />

      {commentPostId && (
        <CommentsSheet
          postId={commentPostId}
          visible={true}
          onClose={() => setCommentPostId(null)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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

  empty: {
    paddingTop: 64,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: font.size.sm,
  },
})
