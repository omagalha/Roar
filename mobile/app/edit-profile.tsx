import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import * as ImagePicker from 'expo-image-picker'
import { useProfileStore } from '@/state/profile'
import { colors, spacing, font, radius } from '@/lib/theme'

const NATIONAL_TEAMS = [
  'Brasil 🇧🇷',
  'Argentina 🇦🇷',
  'França 🇫🇷',
  'Portugal 🇵🇹',
  'Espanha 🇪🇸',
  'Alemanha 🇩🇪',
]

const CLUBS = [
  'Flamengo',
  'Vasco',
  'Fluminense',
  'Botafogo',
  'Corinthians',
  'Palmeiras',
  'São Paulo',
  'Santos',
]

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile, updateProfile } = useProfileStore()

  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio)
  const [nationalTeam, setNationalTeam] = useState(profile.nationalTeam)
  const [favoriteClub, setFavoriteClub] = useState(profile.favoriteClub)
  const [avatarUri, setAvatarUri] = useState<string | null>(profile.avatarUrl)
  const [coverUri, setCoverUri] = useState<string | null>(profile.coverUrl)

  const hasChanges =
    displayName.trim() !== profile.displayName ||
    bio !== profile.bio ||
    nationalTeam !== profile.nationalTeam ||
    favoriteClub !== profile.favoriteClub ||
    avatarUri !== profile.avatarUrl ||
    coverUri !== profile.coverUrl

  const canSave = hasChanges && displayName.trim().length > 0

  function handleSave() {
    if (!canSave) return
    updateProfile({
      displayName: displayName.trim(),
      bio,
      nationalTeam,
      favoriteClub,
      avatarInitial: displayName.trim()[0]?.toUpperCase() ?? profile.avatarInitial,
      avatarUrl: avatarUri,
      coverUrl: coverUri,
    })
    router.back()
  }

  async function handleChangeCover() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      aspect: [16, 9],
      quality: 0.85,
      allowsEditing: true,
    })
    if (!result.canceled) setCoverUri(result.assets[0].uri)
  }

  async function handleChangePhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      aspect: [1, 1],
      quality: 0.85,
      allowsEditing: true,
    })
    if (!result.canceled) setAvatarUri(result.assets[0].uri)
  }

  const avatarInitial = displayName.trim()[0]?.toUpperCase() ?? profile.avatarInitial

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancelText}>{t('post.cancel')}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>{t('profile.save')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Cover ── */}
          <View style={styles.cover}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <>
                <View style={styles.glowRight} />
                <View style={styles.glowLeft} />
              </>
            )}
            <View style={styles.coverFade} />
            <TouchableOpacity
              style={styles.changeCoverBtn}
              onPress={handleChangeCover}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={13} color={colors.white} />
              <Text style={styles.changeCoverText}>{t('profile.changeCover')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Avatar ── */}
          <View style={styles.avatarRow}>
            <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.85}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{avatarInitial}</Text>
                  )}
                  <View style={styles.avatarOverlay}>
                    <Ionicons name="camera-outline" size={20} color={colors.white} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Campos de texto ── */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={colors.muted}
              maxLength={50}
              returnKeyType="next"
            />

            <Text style={[styles.label, styles.labelSpaced]}>{t('profile.bioLabel')}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              placeholder={t('composer.placeholder')}
              placeholderTextColor={colors.muted}
              multiline
              maxLength={160}
              textAlignVertical="top"
            />
          </View>

          {/* ── Seleção ── */}
          <View style={styles.section}>
            <Text style={styles.label}>{t('profile.nationalTeamLabel')}</Text>
            <View style={styles.chipsGrid}>
              {NATIONAL_TEAMS.map((team) => {
                const active = nationalTeam === team
                return (
                  <TouchableOpacity
                    key={team}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setNationalTeam(team)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {team}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* ── Time do coração ── */}
          <View style={[styles.section, styles.sectionLast]}>
            <Text style={styles.label}>{t('profile.favoriteClubLabel')}</Text>
            <View style={styles.chipsGrid}>
              {CLUBS.map((club) => {
                const active = favoriteClub === club
                return (
                  <TouchableOpacity
                    key={club}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setFavoriteClub(club)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {club}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  flex: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
  cancelText: {
    color: colors.text,
    fontSize: font.size.md,
  },
  saveBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: 8,
    borderRadius: radius.full,
    minWidth: 76,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },

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
  changeCoverBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  changeCoverText: {
    color: colors.white,
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
  },

  /* Avatar */
  avatarRow: {
    paddingHorizontal: spacing.md,
    marginTop: -47,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
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
    overflow: 'hidden',
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
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Form */
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionLast: {
    paddingBottom: spacing.xxl,
  },
  label: {
    color: colors.mutedLight,
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  labelSpaced: {
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.white,
    fontSize: font.size.md,
  },
  inputMultiline: {
    height: 90,
    paddingTop: spacing.sm + 2,
    lineHeight: 22,
  },

  /* Chips */
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.red,
    backgroundColor: 'rgba(232, 0, 45, 0.10)',
  },
  chipText: {
    color: colors.mutedLight,
    fontSize: font.size.sm,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: font.weight.medium,
  },
})
