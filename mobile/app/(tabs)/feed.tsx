import { useState, useCallback } from 'react'
import {
  FlatList, View, Text, StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { SocialPostCard, MockPost } from '@/components/feed/SocialPostCard'
import { ComposerCard } from '@/components/feed/ComposerCard'
import { CommentsSheet } from '@/components/feed/CommentsSheet'
import { colors, spacing, font } from '@/lib/theme'

// ---------------------------------------------------------------------------
// Mock data — substituir por hook real quando o banco estiver pronto
// ---------------------------------------------------------------------------
const INITIAL_POSTS: MockPost[] = [
  {
    id: '1',
    user: { username: 'thales', flag: '🇧🇷', initial: 'T' },
    content: 'Brasil hoje joga leve. Se fizer o primeiro, vira goleada.',
    roarCount: 248,
    commentCount: 34,
    repostCount: 12,
    isRoared: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    id: '2',
    user: { username: 'gabi_torcida', flag: '🇧🇷', initial: 'G' },
    content: 'Não tem coração igual ao do torcedor brasileiro. Copa ou não Copa, a gente sempre vai.',
    matchLabel: '🇧🇷 Brasil × 🇫🇷 França · Hoje 18h',
    roarCount: 891,
    commentCount: 127,
    repostCount: 64,
    isRoared: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    user: { username: 'narrador_br', flag: '🇧🇷', initial: 'N' },
    content: 'Mbappé chega quieto. França vai pesar muito na fase de grupos, cuidado.',
    roarCount: 156,
    commentCount: 22,
    repostCount: 8,
    isRoared: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    user: { username: 'copa2026', flag: '🌎', initial: 'C' },
    content: 'Mês mais esperado do mundo. Que comecem os jogos.',
    isLive: true,
    matchLabel: '🇦🇷 Argentina × 🇺🇾 Uruguai · AO VIVO 67\'',
    roarCount: 1204,
    commentCount: 89,
    repostCount: 230,
    isRoared: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '5',
    user: { username: 'resenha_futebol', flag: '🇧🇷', initial: 'R' },
    content: 'Quem não acredita que a Argentina defende o título não entende de futebol. Eles são completos.',
    roarCount: 432,
    commentCount: 76,
    repostCount: 33,
    isRoared: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: '6',
    user: { username: 'jogo_bonito', flag: '🇵🇹', initial: 'J' },
    content: 'Portugal sem CR7 na seleção principal vai ser diferente. Mas tem talento de sobra.',
    roarCount: 319,
    commentCount: 51,
    repostCount: 17,
    isRoared: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
  },
]

type Tab = 'foryou' | 'following' | 'live'

const TABS: { key: Tab; label: string }[] = [
  { key: 'foryou', label: 'Para você' },
  { key: 'following', label: 'Seguindo' },
  { key: 'live', label: '• Ao vivo' },
]

// ---------------------------------------------------------------------------
export default function FeedTab() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('foryou')
  const [commentPostId, setCommentPostId] = useState<string | null>(null)

  const visiblePosts = activeTab === 'live'
    ? INITIAL_POSTS.filter((p) => p.isLive)
    : activeTab === 'following'
      ? []
      : INITIAL_POSTS

  const renderItem = useCallback(({ item }: { item: MockPost }) => (
    <SocialPostCard
      post={item}
      onComment={setCommentPostId}
    />
  ), [])

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

      <FlatList<MockPost>
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeTab === 'foryou' ? (
            <ComposerCard onPress={() => router.push('/create-post')} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {activeTab === 'following' ? (
              <>
                <Text style={styles.emptyTitle}>Siga pessoas para ver o feed</Text>
                <Text style={styles.emptyDesc}>em breve você poderá seguir torcedores</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>nenhuma partida ao vivo</Text>
                <Text style={styles.emptyDesc}>os posts de jogos em curso aparecerão aqui</Text>
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
