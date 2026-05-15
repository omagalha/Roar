import { useCallback } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useLiveMatchesStore } from '@/state/liveMatches'
import { LiveMatchCard } from '@/components/matches/LiveMatchCard'
import { Match } from '@/types/match'
import { colors, spacing, font } from '@/lib/theme'

type ListItem =
  | { type: 'header'; id: string; title: string }
  | { type: 'match'; id: string; match: Match }
  | { type: 'empty'; id: string }

export default function MatchesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const matches = useLiveMatchesStore((s) => s.matches)

  const live = matches.filter((m) => m.status === 'live')
  const upcoming = matches.filter((m) => m.status === 'upcoming')
  const finished = matches.filter((m) => m.status === 'finished')

  const sections: Array<{ key: string; title: string; data: Match[] }> = [
    ...(live.length ? [{ key: 'live', title: t('matches.live'), data: live }] : []),
    ...(upcoming.length ? [{ key: 'upcoming', title: t('matches.upcoming'), data: upcoming }] : []),
    ...(finished.length ? [{ key: 'finished', title: t('matches.finished'), data: finished }] : []),
  ]

  const items: ListItem[] = sections.flatMap((s) => [
    { type: 'header', id: `h-${s.key}`, title: s.title },
    ...s.data.map((m) => ({ type: 'match' as const, id: m.id, match: m })),
  ])

  const handlePress = useCallback(
    (id: string) => router.push(`/match/${id}` as never),
    [router],
  )

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return <Text style={styles.sectionHeader}>{item.title}</Text>
      }
      return <LiveMatchCard match={item.match} onPress={handlePress} />
    },
    [handlePress],
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.appName}>ROAR</Text>
        <Text style={styles.subtitle}>{t('matches.subtitle')}</Text>
      </View>

      <FlatList<ListItem>
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('matches.empty')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appName: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.bold,
    color: colors.white,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: font.size.xs,
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.lg * 2,
  },
  sectionHeader: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: font.size.md,
  },
})
