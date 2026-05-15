import { useCallback, useState } from 'react'
import {
  FlatList, View, Text, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useGlobalFeed, PostWithProfile } from '@/hooks/useGlobalFeed'
import { PostCard } from '@/components/feed/PostCard'
import { CommentsSheet } from '@/components/feed/CommentsSheet'
import { colors, spacing, font } from '@/lib/theme'

export default function FeedTab() {
  const router = useRouter()
  const { posts, isLoading, refetch, fetchNextPage, hasNextPage, like, isLiked } = useGlobalFeed()
  const [commentPostId, setCommentPostId] = useState<string | null>(null)

  const renderItem = useCallback(({ item }: { item: PostWithProfile }) => (
    <PostCard
      post={item}
      isLiked={isLiked(item.id)}
      onLike={like}
      onComment={setCommentPostId}
    />
  ), [like, isLiked])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.red} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>ROAR</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/create-post')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList<PostWithProfile>
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.red}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>nenhum post ainda</Text>
            <Text style={styles.emptyDesc}>seja o primeiro a postar</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/create-post')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.white} />
              <Text style={styles.emptyBtnText}>criar post</Text>
            </TouchableOpacity>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    fontSize: 22,
    fontWeight: font.weight.bold,
    color: colors.white,
    letterSpacing: 4,
  },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.white },
  emptyDesc: { fontSize: font.size.sm, color: colors.muted },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
    marginTop: spacing.md,
  },
  emptyBtnText: { color: colors.white, fontWeight: font.weight.bold },
})
