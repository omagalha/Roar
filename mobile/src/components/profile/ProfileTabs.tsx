import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing, font } from '@/lib/theme'

export type ProfileTab = 'posts' | 'media' | 'roars'

type Props = {
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
}

export function ProfileTabs({ activeTab, onTabChange }: Props) {
  const { t } = useTranslation()

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'posts', label: t('profile.posts') },
    { key: 'media', label: t('profile.media') },
    { key: 'roars', label: t('profile.roars') },
  ]

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
            {active && <View style={styles.indicator} />}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 4,
    position: 'relative',
  },
  label: {
    color: colors.mutedLight,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.white,
    fontWeight: font.weight.bold,
    letterSpacing: 0.3,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: '18%',
    right: '18%',
    height: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: colors.red,
  },
})
