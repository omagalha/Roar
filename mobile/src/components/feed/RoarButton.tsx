import { useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors, font } from '@/lib/theme'
import { RoarIcon } from '@/components/brand/RoarIcon'

const INACTIVE = colors.subtle

type Props = {
  initialCount: number
  initialRoared?: boolean
  onChange?: (roared: boolean) => void
}

function formatCount(value: number): string {
  if (value >= 10000) return `${Math.round(value / 1000)}k`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`
  return String(value)
}

export function RoarButton({ initialCount, initialRoared = false, onChange }: Props) {
  const [roared, setRoared] = useState(initialRoared)
  const [count, setCount] = useState(initialCount)
  const scale = useRef(new Animated.Value(1)).current

  function animate() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, speed: 22, bounciness: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
    ]).start()
  }

  async function handlePress() {
    const next = !roared
    setRoared(next)
    setCount((c) => c + (next ? 1 : -1))
    animate()
    if (next) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange?.(next)
  }

  return (
    <Pressable onPress={handlePress} hitSlop={10}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <RoarIcon
          size={20}
          color={roared ? colors.white : INACTIVE}
          filled={roared}
        />
        <View style={styles.textRow}>
          <Text style={[styles.label, roared && styles.labelActive]}>
            {roared ? 'Rugiu' : 'Rugir'}
          </Text>
          <Text style={[styles.dot, roared && styles.dotActive]}>·</Text>
          <Text style={[styles.count, roared && styles.countActive]}>
            {formatCount(count)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: INACTIVE,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
  labelActive: {
    color: colors.red,
    fontWeight: font.weight.bold,
  },
  dot: { color: INACTIVE, fontSize: font.size.sm },
  dotActive: { color: colors.red },
  count: {
    color: INACTIVE,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
  countActive: {
    color: colors.red,
    fontWeight: font.weight.bold,
  },
})
