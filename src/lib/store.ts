import type { MoodKey, ReactionId } from './moods'

export interface Owner {
  slug: string
  prompt: string
  createdAt: number
}

export interface FeedEntry {
  id: string
  mood: MoodKey
  msg: string
  ts: number
  seen: boolean
}

const KEYS = {
  owner: 'moodful.owner.v1',
  feed: (slug: string) => `moodful.feed.${slug}`,
  reacts: (slug: string) => `moodful.react.${slug}`,
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / private mode */
  }
}

export const storage = {
  loadOwner(): Owner | null {
    return safeRead<Owner | null>(KEYS.owner, null)
  },
  saveOwner(o: Owner) {
    safeWrite(KEYS.owner, o)
  },
  loadFeed(slug: string): FeedEntry[] {
    return safeRead<FeedEntry[]>(KEYS.feed(slug), [])
  },
  saveFeed(slug: string, list: FeedEntry[]) {
    safeWrite(KEYS.feed(slug), list)
  },
  loadReacts(slug: string): Record<string, ReactionId | null> {
    return safeRead<Record<string, ReactionId | null>>(KEYS.reacts(slug), {})
  },
  saveReacts(slug: string, map: Record<string, ReactionId | null>) {
    safeWrite(KEYS.reacts(slug), map)
  },
  feedKey(slug: string) {
    return KEYS.feed(slug)
  },
}

export function makeSlug(): string {
  const alpha = 'abcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alpha[Math.floor(Math.random() * alpha.length)]
  return s
}

export function ensureOwner(): Owner {
  let o = storage.loadOwner()
  if (!o) {
    o = {
      slug: makeSlug(),
      prompt: 'How do you feel about me today?',
      createdAt: Date.now(),
    }
    storage.saveOwner(o)
  }
  return o
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
