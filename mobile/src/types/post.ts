export type PostContext = 'general' | 'pre_match' | 'live'

export type Post = {
  id: string
  username: string
  avatarInitial: string
  teamFlag: string
  text: string
  imageUrl?: string | null
  matchLabel?: string | null
  context: PostContext
  isLive: boolean
  roarCount: number
  isRoared: boolean
  commentsCount: number
  repostsCount: number
  createdAt: string
}
