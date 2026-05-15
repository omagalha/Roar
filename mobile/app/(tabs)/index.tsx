import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMatches } from '@/hooks/useMatches'
import { MatchCard } from '@/components/matches/MatchCard'
import { MatchCardSkeleton } from '@/components/ui/Skeleton'
import { MatchWithTeams } from '@/types/database'
import { colors, spacing, font } from '@/lib/theme'

export default function MatchesScreen() {
  const { data: matches, isLoading, refetch, isRefetching } = useMatches()

  const live = matches?.filter((m) => m.status === 'LIVE' || m.status === 'HT') ?? []
  const upcoming = matches?.filter((m) => m.status === 'NS') ?? []
  const finished = matches?.filter((m) => m.status === 'FT') ?? []

  const sections: Array<{ title: string; data: MatchWithTeams[] }> = [
    ...(live.length ? [{ title: 'AO VIVO', data: live }] : []),
    ...(upcoming.length ? [{ title: 'EM BREVE', data: upcoming }] : []),
    ...(finished.length ? [{ title: 'ENCERRADOS', data: finished }] : []),
  ]

  const items = sections.flatMap((s) => [
    { type: 'header' as const, title: s.title, id: `h-${s.title}` },
    ...s.data.map((m) => ({ type: 'match' as const, match: m, id: m.id })),
  ])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Text style={styles.appName}>ROAR</Text>
          <Text style={styles.subtitle}>Copa do Mundo 2026</Text>
        </View>
        <View style={{ padding: spacing.lg }}>
          {[1, 2, 3].map((i) => <MatchCardSkeleton key={i} />)}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.appName}>ROAR</Text>
        <Text style={styles.subtitle}>Copa do Mundo 2026</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.red}
            colors={[colors.red]}
          />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text style={styles.sectionHeader}>{item.title}</Text>
            )
          }
          return <MatchCard match={item.match} />
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>nenhuma partida hoje</Text>
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
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  list: {
    padding: spacing.lg,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  empty: {
    color: colors.muted,
    fontSize: font.size.md,
  },
})
