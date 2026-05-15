import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useProfile } from '@/hooks/useProfile'
import { colors, spacing, font } from '@/lib/theme'

type Props = {
  onPress: () => void
}

export function ComposerCard({ onPress }: Props) {
  const { profile } = useProfile()
  const initial = (profile?.username ?? '?')[0].toUpperCase()

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.placeholder} numberOfLines={1}>
        O que você está pensando sobre futebol?
      </Text>
      <Ionicons name="image-outline" size={20} color={colors.muted} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },
  placeholder: {
    flex: 1,
    color: colors.muted,
    fontSize: font.size.md,
  },
})
