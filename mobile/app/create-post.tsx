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
import { useQueryClient } from '@tanstack/react-query'
import { colors, spacing, font, radius } from '@/lib/theme'

export default function CreatePostScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { createPost, uploading } = useCreatePost()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [caption, setCaption] = useState('')

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 5],
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  async function handlePost() {
    if (!imageUri) return
    const ok = await createPost({ imageUri, caption })
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['global-feed'] })
      router.back()
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>novo post</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!imageUri || uploading) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!imageUri || uploading}
          >
            {uploading
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.postBtnText}>publicar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Seletor de imagem */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.muted} />
                <Text style={styles.imagePlaceholderText}>toque para escolher uma foto</Text>
              </View>
            )}
          </TouchableOpacity>

          {imageUri && (
            <TouchableOpacity style={styles.changePhoto} onPress={pickImage}>
              <Text style={styles.changePhotoText}>trocar foto</Text>
            </TouchableOpacity>
          )}

          {/* Legenda */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="escreva uma legenda..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={300}
            />
            <Text style={styles.charCount}>{caption.length}/300</Text>
          </View>
        </ScrollView>
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
  headerTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.white },
  postBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    minWidth: 72,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: colors.white, fontWeight: font.weight.bold, fontSize: font.size.sm },

  body: { padding: spacing.lg, gap: spacing.lg },

  imagePicker: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: { width: '100%', aspectRatio: 4 / 5 },
  imagePlaceholder: {
    aspectRatio: 4 / 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  imagePlaceholderText: { color: colors.muted, fontSize: font.size.sm },

  changePhoto: { alignItems: 'center' },
  changePhotoText: { color: colors.muted, fontSize: font.size.sm, textDecorationLine: 'underline' },

  captionContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  captionInput: {
    color: colors.text,
    fontSize: font.size.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: { color: colors.muted, fontSize: font.size.xs, textAlign: 'right', marginTop: spacing.xs },
})
