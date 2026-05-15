import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { colors, font } from '@/lib/theme'
import { RoarIcon } from '@/components/brand/RoarIcon'

const INACTIVE = colors.mutedLight

type Props = {
  count: number
  isRoared: boolean
  onPress: () => void
}

function formatCount(value: number): string {
  if (value >= 10000) return `${Math.round(value / 1000)}k`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`
  return String(value)
}

export function RoarButton({ count, isRoared, onPress }: Props) {
  const { t } = useTranslation()
  const scale = useRef(new Animated.Value(1)).current

  function animate() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, speed: 22, bounciness: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
    ]).start()
  }

  async function handlePress() {
    animate()
    if (!isRoared) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable onPress={handlePress} hitSlop={10}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <RoarIcon
          size={22}
          color={isRoared ? colors.white : INACTIVE}
          filled={isRoared}
        />
        <View style={styles.textRow}>
          <Text style={[styles.label, isRoared && styles.labelActive]}>
            {isRoared ? t('actions.roared') : t('actions.roar')}
          </Text>
          <Text style={[styles.dot, isRoared && styles.dotActive]}>·</Text>
          <Text style={[styles.count, isRoared && styles.countActive]}>
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
