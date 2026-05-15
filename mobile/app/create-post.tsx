import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useCreatePost } from '@/hooks/useCreatePost'
import { useProfile } from '@/hooks/useProfile'
import { useQueryClient } from '@tanstack/react-query'
import { colors, spacing, font, radius } from '@/lib/theme'

export default function CreatePostScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { createPost, uploading } = useCreatePost()
  const { profile } = useProfile()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [text, setText] = useState('')

  const canPost = (text.trim().length > 0 || imageUri !== null) && !uploading
  const username = profile?.username ?? '?'
  const initial = username[0].toUpperCase()

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  async function handlePost() {
    if (!canPost) return
    const ok = await createPost({ imageUri, caption: text })
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['global-feed'] })
      router.back()
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost}
        >
          {uploading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.postBtnText}>Publicar</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.composeRow}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            {/* Text + image */}
            <View style={styles.composeContent}>
              <TextInput
                style={styles.textInput}
                value={text}
                onChangeText={setText}
                placeholder="O que está acontecendo?"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                autoFocus
              />

              {imageUri && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setImageUri(null)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={26} color={colors.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={pickImage} style={styles.toolbarBtn} activeOpacity={0.7}>
            <Ionicons name="image-outline" size={22} color={colors.red} />
          </TouchableOpacity>
          <Text style={styles.charCount}>{text.length}/500</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.sm },

  body: { padding: spacing.md, flexGrow: 1 },

  composeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.md },

  composeContent: { flex: 1 },
  textInput: {
    color: colors.text,
    fontSize: font.size.lg,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },

  imageContainer: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 13,
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
    color: colors.muted,
    fontSize: font.size.xs,
  },
})
