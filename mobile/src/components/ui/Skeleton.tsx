import { useEffect, useRef } from 'react'
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native'
import { colors, radius } from '@/lib/theme'

type Props = {
  width?: DimensionValue
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start()
  }, [])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border } satisfies ViewStyle,
        { opacity },
        style,
      ]}
    />
  )
}

export function MatchCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton width={60} height={10} style={{ marginBottom: 12 }} />
      <View style={skeletonStyles.row}>
        <View style={skeletonStyles.teamBlock}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={70} height={12} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={60} height={32} borderRadius={6} />
        <View style={[skeletonStyles.teamBlock, { alignItems: 'flex-end' }]}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={70} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
})
