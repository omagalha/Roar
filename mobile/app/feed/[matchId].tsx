import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ViewToken,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useReactions, ReactionWithProfile } from '@/hooks/useReactions'
import { ReactionVideo } from '@/components/feed/ReactionVideo'
import { colors, spacing, font } from '@/lib/theme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function FeedScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const router = useRouter()
  const { reactions, isLoading, fetchNextPage, hasNextPage, like, isLiked } = useReactions(matchId)
  const [activeIndex, setActiveIndex] = useState(0)

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 200,
  })

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    [],
  )

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    )
  }

  if (!reactions.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎬</Text>
          <Text style={styles.emptyTitle}>nenhuma reação ainda</Text>
          <Text style={styles.emptyDesc}>seja o primeiro a gravar</Text>
          <TouchableOpacity
            style={styles.recordFirstButton}
            onPress={() => router.push(`/camera/${matchId}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={18} color={colors.white} />
            <Text style={styles.recordFirstText}>gravar reação</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.safe}>
      {/* Botão voltar flutuante */}
      <SafeAreaView style={styles.floatingHeader} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.counterChip}>
          <Text style={styles.counterText}>
            {activeIndex + 1}/{reactions.length}
          </Text>
        </View>
      </SafeAreaView>

      <FlatList<ReactionWithProfile>
        data={reactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReactionVideo
            reaction={item}
            isActive={index === activeIndex}
            isLiked={isLiked(item.id)}
            onLike={like}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', gap: spacing.md },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00000060',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterChip: {
    backgroundColor: '#00000060',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: { color: colors.white, fontSize: font.size.sm, fontWeight: font.weight.bold },

  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.white },
  emptyDesc: { fontSize: font.size.sm, color: colors.muted },
  recordFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
    marginTop: spacing.sm,
  },
  recordFirstText: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.md },
})
