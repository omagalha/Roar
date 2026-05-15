import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useTranslation } from 'react-i18next'
import { UserProfile } from '@/types/profile'
import { colors, spacing, font, radius } from '@/lib/theme'

type Props = {
  profile: UserProfile
  onEditPress?: () => void
}

export function ProfileHeader({ profile, onEditPress }: Props) {
  const { t } = useTranslation()

  return (
    <View>
      {/* ── Cover ── */}
      <View style={styles.cover}>
        {profile.coverUrl ? (
          <Image source={{ uri: profile.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <>
            <View style={styles.glowRight} />
            <View style={styles.glowLeft} />
          </>
        )}
        <View style={styles.coverFade} />
      </View>

      {/* ── Avatar row + Edit button ── */}
      <View style={styles.actionBar}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{profile.avatarInitial}</Text>
            )}
          </View>
        </View>

        <View style={styles.spacer} />

        {onEditPress !== undefined && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEditPress}
            activeOpacity={0.75}
          >
            <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Info ── */}
      <View style={styles.info}>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>

        {!!profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{profile.nationalTeam}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>❤️ {profile.favoriteClub}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  /* Cover */
  cover: {
    height: 130,
    backgroundColor: '#08031a',
    overflow: 'hidden',
  },
  glowRight: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.red,
    opacity: 0.13,
    top: -80,
    right: -60,
  },
  glowLeft: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#7b00ff',
    opacity: 0.07,
    bottom: -60,
    left: -40,
  },
  coverFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.dark,
    opacity: 0.55,
  },

  /* Avatar + edit row */
  actionBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    marginTop: -47,
    paddingBottom: spacing.sm,
  },
  avatarRing: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.card,
    borderWidth: 2.5,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarText: {
    color: colors.white,
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
  },
  spacer: { flex: 1 },
  editBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.mutedLight,
  },
  editBtnText: {
    color: colors.white,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },

  /* Info */
  info: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 3,
  },
  displayName: {
    color: colors.white,
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
  },
  username: {
    color: colors.muted,
    fontSize: font.size.sm,
    marginBottom: 2,
  },
  bio: {
    color: colors.text,
    fontSize: font.size.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(110, 106, 138, 0.5)',
    backgroundColor: colors.card,
  },
  chipText: {
    color: colors.mutedLight,
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    letterSpacing: 0.2,
  },
})
