import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/hooks/useProfile'
import { usePostsStore } from '@/state/posts'
import { colors, spacing, font, radius } from '@/lib/theme'

type Context = 'geral' | 'pre-jogo' | 'ao-vivo'

const MAX = 500

export default function CreatePostScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { profile } = useProfile()
  const addPost = usePostsStore((s) => s.addPost)

  const CONTEXTS: { key: Context; label: string }[] = [
    { key: 'geral', label: t('post.general') },
    { key: 'pre-jogo', label: t('post.preMatch') },
    { key: 'ao-vivo', label: t('post.live') },
  ]
  const [text, setText] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [context, setContext] = useState<Context>('geral')

  const canPost = text.trim().length > 0 || imageUri !== null
  const username = profile?.username ?? 'você'
  const initial = username[0].toUpperCase()
  const remaining = MAX - text.length
  const nearLimit = remaining <= 50

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  function handlePost() {
    if (!canPost) return
    addPost({
      username,
      avatarInitial: initial,
      teamFlag: '',
      text: text.trim(),
      imageUrl: imageUri,
      context:
        context === 'pre-jogo' ? 'pre_match'
        : context === 'ao-vivo' ? 'live'
        : 'general',
    })
    // TODO: persistir no Supabase quando o banco estiver pronto
    router.back()
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancelText}>{t('post.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost}
        >
          <Text style={styles.postBtnText}>{t('post.publish')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Compose */}
          <View style={styles.composeRow}>
            {/* Avatar col */}
            <View style={styles.avatarCol}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>

            {/* Content col */}
            <View style={styles.composeContent}>
              <Text style={styles.username}>@{username}</Text>
              <TextInput
                style={styles.textInput}
                value={text}
                onChangeText={setText}
                placeholder={t('composer.createPlaceholder')}
                placeholderTextColor={colors.muted}
                multiline
                maxLength={MAX}
                autoFocus
              />

              {imageUri && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setImageUri(null)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Context selector */}
          <View style={styles.contextSection}>
            <Text style={styles.contextLabel}>{t('post.context')}</Text>
            <View style={styles.chips}>
              {CONTEXTS.map((c) => {
                const active = context === c.key
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setContext(c.key)}
                    activeOpacity={0.7}
                  >
                    {c.key === 'ao-vivo' && active && (
                      <View style={styles.liveDot} />
                    )}
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={pickImage} style={styles.toolbarBtn} activeOpacity={0.7}>
            <Ionicons name="image-outline" size={22} color={colors.red} />
          </TouchableOpacity>
          {text.length > 0 && (
            <Text style={[styles.charCount, nearLimit && styles.charCountWarn]}>
              {remaining}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    color: colors.text,
    fontSize: font.size.md,
  },
  postBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: 8,
    borderRadius: radius.full,
    minWidth: 76,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },

  body: { paddingVertical: spacing.md, flexGrow: 1 },

  composeRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  avatarCol: {
    width: 48,
    alignItems: 'center',
    paddingTop: 2,
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
  },
  avatarText: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },

  composeContent: { flex: 1, paddingRight: spacing.md },
  username: {
    color: colors.white,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
    marginBottom: spacing.sm,
  },
  textInput: {
    color: colors.text,
    fontSize: font.size.lg,
    lineHeight: 26,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  imageContainer: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', aspectRatio: 4 / 3 },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
  },

  contextSection: {
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.md + 48,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  contextLabel: {
    color: colors.muted,
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.red,
    backgroundColor: 'rgba(232, 0, 45, 0.08)',
  },
  chipText: {
    color: colors.mutedLight,
    fontSize: font.size.sm,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: font.weight.bold,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.red,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toolbarBtn: { padding: spacing.xs },
  charCount: {
    color: colors.mutedLight,
    fontSize: font.size.sm,
  },
  charCountWarn: {
    color: colors.red,
    fontWeight: font.weight.bold,
  },
})
