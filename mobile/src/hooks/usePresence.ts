import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

type PresenceState = {
  user_id: string
  team_id: string | null
  mode: 'watching' | 'recording' | 'posting'
  recording?: boolean
}

export function usePresence(matchId: string) {
  const { user, profile } = useAuthStore()
  const [count, setCount] = useState(0)
  const [recordingCount, setRecordingCount] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel(`match:${matchId}:presence`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const presences = Object.values(state).flat()
        setCount(presences.length)
        setRecordingCount(
          presences.filter((presence) => presence.mode === 'recording' || presence.recording).length,
        )
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            team_id: profile?.team_id ?? null,
            mode: 'watching',
          })
        }
      })

    channelRef.current = channel

    return () => {
      channel.untrack()
      channel.unsubscribe()
    }
  }, [matchId, user, profile])

  async function setRecording(recording: boolean) {
    await channelRef.current?.track({
      user_id: user?.id,
      team_id: profile?.team_id ?? null,
      mode: recording ? 'recording' : 'watching',
    })
  }

  async function setPosting() {
    await channelRef.current?.track({
      user_id: user?.id,
      team_id: profile?.team_id ?? null,
      mode: 'posting',
    })
  }

  return { count, recordingCount, setRecording, setPosting }
}
