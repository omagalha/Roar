import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'

type CreatePostParams = {
  imageUri?: string | null
  caption: string
  matchId?: string | null
}

export function useCreatePost() {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)

  async function createPost({ imageUri, caption, matchId }: CreatePostParams): Promise<boolean> {
    if (!user) return false
    if (!imageUri && !caption.trim()) return false
    setUploading(true)

    try {
      let image_url: string | null = null
      let storage_path: string | null = null

      if (imageUri) {
        const response = await fetch(imageUri)
        const blob = await response.blob()
        const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `posts/${user.id}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(path, blob, { contentType: `image/${ext}` })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path)
        image_url = publicUrl
        storage_path = path
      }

      const { error: insertError } = await supabase.rpc('create_post', {
        target_image_url: image_url,
        target_caption: caption.trim() || null,
        target_match_id: matchId ?? null,
        target_storage_path: storage_path,
      })

      if (insertError) throw insertError
      return true
    } catch (e) {
      console.error('createPost error:', e)
      return false
    } finally {
      setUploading(false)
    }
  }

  return { createPost, uploading }
}
