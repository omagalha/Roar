import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/hooks/useProfile'
import { colors, spacing, font } from '@/lib/theme'

type Props = {
  onPress: () => void
}

export function ComposerCard({ onPress }: Props) {
  const { t } = useTranslation()
  const { profile } = useProfile()
  const initial = (profile?.username ?? '?')[0].toUpperCase()

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.placeholder} numberOfLines={1}>
        {t('composer.placeholder')}
      </Text>
      <Ionicons name="image-outline" size={21} color={colors.mutedLight} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.red,
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
    color: colors.mutedLight,
    fontSize: font.size.md,
  },
})
