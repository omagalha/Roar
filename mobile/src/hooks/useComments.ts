import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/state/auth'

export type CommentWithProfile = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profile?: { username: string; avatar_url: string | null }
}

async function fetchComments(postId: string): Promise<CommentWithProfile[]> {
  const { data } = await supabase
    .from('comments')
    .select('*, profile:profiles(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return (data ?? []) as CommentWithProfile[]
}

export function useComments(postId: string, enabled = true) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const query = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    enabled: enabled && !!postId,
  })

  const addMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user!.id,
        content,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  async function addComment(content: string): Promise<boolean> {
    try {
      await addMutation.mutateAsync(content)
      return true
    } catch {
      return false
    }
  }

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    addComment,
    isAdding: addMutation.isPending,
  }
}
