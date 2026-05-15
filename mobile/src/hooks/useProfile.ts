import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'
import { Profile } from '@/types/database'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data as Profile | null
}

type CreateProfileParams = {
  username: string
  teamId: string | null
}

export function useProfile() {
  const { user, setProfile } = useAuthStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  })

  const createMutation = useMutation({
    mutationFn: async ({ username, teamId }: CreateProfileParams) => {
      const { data, error } = await supabase.rpc('upsert_own_profile', {
        target_username: username,
        target_team_id: teamId,
      })
      if (error) throw error
      return data as Profile
    },
    onSuccess: (profile) => {
      setProfile(profile)
      queryClient.setQueryData(['profile', user?.id], profile)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'username' | 'team_id'>>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: (profile) => {
      setProfile(profile)
      queryClient.setQueryData(['profile', user?.id], profile)
    },
  })

  return {
    profile: query.data,
    isLoading: query.isLoading,
    createProfile: createMutation.mutateAsync,
    updateProfile: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
