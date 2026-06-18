import rawItems from '@/data/feed-items.json'

export interface FeedItem {
  id: string
  type: 'video' | 'music'
  title: string
  channel?: string
  artist?: string
  youtube_id: string
  duration: string
  level: string
  tags: string[]
  preview: string
  maintenance?: boolean
}

export const FEED_ITEMS: FeedItem[] = rawItems as FeedItem[]

export function getFeedItem(id: string): FeedItem | undefined {
  return FEED_ITEMS.find((item) => item.id === id)
}

export function getThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
}

export function getYouTubeUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function getLevelColor(level: string): string {
  const idx = LEVEL_ORDER.indexOf(level)
  if (idx <= 1) return '#4CAF50'
  if (idx <= 3) return '#FF9800'
  return '#F44336'
}
