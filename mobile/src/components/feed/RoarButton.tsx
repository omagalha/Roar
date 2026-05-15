import { useRef } from 'react'
import { TouchableOpacity, Text, Animated, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, font, spacing } from '@/lib/theme'

type Props = {
  count: number
  isRoared: boolean
  onPress: () => void
}

export function RoarButton({ count, isRoared, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current

  function handlePress() {
    if (!isRoared) {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.4,
          useNativeDriver: true,
          speed: 50,
          bounciness: 14,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
      ]).start()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    onPress()
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
        {/* TODO: substituir por SVG de leão/fera próprio do Roar */}
        <Ionicons
          name={isRoared ? 'megaphone' : 'megaphone-outline'}
          size={18}
          color={isRoared ? colors.red : colors.muted}
        />
        <Text style={[styles.label, isRoared && styles.labelActive]}>
          {isRoared ? 'Rugiu' : 'Rugir'}
        </Text>
        {count > 0 && (
          <Text style={[styles.count, isRoared && styles.countActive]}>
            {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    color: colors.muted,
    fontSize: font.size.sm,
  },
  labelActive: { color: colors.red },
  count: {
    color: colors.muted,
    fontSize: font.size.sm,
  },
  countActive: { color: colors.red },
})
