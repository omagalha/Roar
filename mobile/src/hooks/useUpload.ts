import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export function useUpload() {
  const { user } = useAuthStore()
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)

  async function uploadReaction(params: {
    videoUri: string
    matchId: string
    eventId: string | null
    durationMs: number
  }): Promise<string | null> {
    if (!user) return null
    setState('uploading')
    setProgress(0)

    try {
      const path = `${params.matchId}/${user.id}/${Date.now()}.mp4`

      const response = await fetch(params.videoUri)
      const blob = await response.blob()
      setProgress(30)

      const { error: uploadError } = await supabase.storage
        .from('reactions')
        .upload(path, blob, { contentType: 'video/mp4', upsert: false })

      if (uploadError) throw uploadError
      setProgress(70)

      const { data: { publicUrl } } = supabase.storage
        .from('reactions')
        .getPublicUrl(path)

      const { data, error: rpcError } = await supabase.rpc('create_reaction', {
        target_match_id: params.matchId,
        target_event_id: params.eventId,
        target_video_url: publicUrl,
        target_thumbnail_url: null,
        target_duration_ms: params.durationMs,
        target_storage_path: path,
        target_mime_type: 'video/mp4',
      })

      if (rpcError) throw rpcError
      setProgress(100)
      setState('done')
      return (data as { id: string } | null)?.id ?? null
    } catch {
      setState('error')
      return null
    }
  }

  function reset() {
    setState('idle')
    setProgress(0)
  }

  return { uploadReaction, state, progress, reset }
}
