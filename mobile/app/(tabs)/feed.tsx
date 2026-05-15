import { useState, useCallback } from 'react'
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SocialPostCard, Post } from '@/components/feed/SocialPostCard'
import { ComposerCard } from '@/components/feed/ComposerCard'
import { CommentsSheet } from '@/components/feed/CommentsSheet'
import { usePostsStore } from '@/state/posts'
import { colors, spacing, font } from '@/lib/theme'

type Tab = 'foryou' | 'following' | 'live'

export default function FeedTab() {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('foryou')
  const [commentPostId, setCommentPostId] = useState<string | null>(null)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'foryou', label: t('feed.forYou') },
    { key: 'following', label: t('feed.following') },
    { key: 'live', label: `• ${t('feed.live')}` },
  ]

  const posts = usePostsStore((s) => s.posts)
  const toggleRoar = usePostsStore((s) => s.toggleRoar)

  const visiblePosts =
    activeTab === 'live'
      ? posts.filter((p) => p.isLive)
      : activeTab === 'following'
        ? []
        : posts

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ROAR</Text>
      </View>

      {/* Abas internas */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive,
              tab.key === 'live' && styles.tabLabelLive,
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList<Post>
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeTab === 'foryou'
            ? <ComposerCard onPress={() => router.push('/create-post')} />
            : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {activeTab === 'following' ? (
              <>
                <Text style={styles.emptyTitle}>{t('feed.emptyFollowing')}</Text>
                <Text style={styles.emptyDesc}>{t('feed.emptyFollowingDesc')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>{t('feed.emptyLive')}</Text>
                <Text style={styles.emptyDesc}>{t('feed.emptyLiveDesc')}</Text>
              </>
            )}
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

  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 20,
    fontWeight: font.weight.bold,
    color: colors.white,
    letterSpacing: 5,
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    position: 'relative',
  },
  tabLabel: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
  tabLabelActive: {
    color: colors.white,
    fontWeight: font.weight.bold,
  },
  tabLabelLive: {
    color: colors.red,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.red,
  },

  empty: {
    paddingTop: 80,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
  emptyDesc: {
    color: colors.muted,
    fontSize: font.size.sm,
  },
})
