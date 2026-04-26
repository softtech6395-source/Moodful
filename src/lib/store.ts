import type { MoodKey, ReactionId } from './moods'

export interface Owner {
  slug: string
  prompt: string
  createdAt: number
  /** Currently selected mood room (id from rooms.ts) — defaults to 'open' */
  roomId?: string
  /** Hidden mood for the Guess My Mood game; null when game is off */
  hiddenMood?: MoodKey | null
  /** Achievement ids the owner has unlocked */
  unlocks?: string[]
  /** Set of YYYY-MM-DD keys the owner has been "active" on */
  activeDays?: string[]
}

export interface FeedEntry {
  id: string
  mood: MoodKey
  msg: string
  ts: number
  seen: boolean
  /** non-null when the visitor used the Guess game */
  guess?: { mood: MoodKey; correct: boolean } | null
  /** non-null when the visitor used the Random Mood Drop button */
  random?: boolean
  /** non-null after owner sends a mood back */
  reply?: { mood: MoodKey; ts: number } | null
}

export interface GuessStats {
  correct: number
  total: number
}

const KEYS = {
  owner: 'moodful.owner.v2',
  feed: (slug: string) => `moodful.feed.${slug}`,
  reacts: (slug: string) => `moodful.react.${slug}`,
  guessStats: (slug: string) => `moodful.guess.${slug}`,
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
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota / private */ }
}

export const storage = {
  loadOwner(): Owner | null {
    return safeRead<Owner | null>(KEYS.owner, null)
  },
  saveOwner(o: Owner) { safeWrite(KEYS.owner, o) },
  loadFeed(slug: string): FeedEntry[] {
    return safeRead<FeedEntry[]>(KEYS.feed(slug), [])
  },
  saveFeed(slug: string, list: FeedEntry[]) { safeWrite(KEYS.feed(slug), list) },
  loadReacts(slug: string): Record<string, ReactionId | null> {
    return safeRead<Record<string, ReactionId | null>>(KEYS.reacts(slug), {})
  },
  saveReacts(slug: string, map: Record<string, ReactionId | null>) { safeWrite(KEYS.reacts(slug), map) },
  loadGuessStats(slug: string): GuessStats {
    return safeRead<GuessStats>(KEYS.guessStats(slug), { correct: 0, total: 0 })
  },
  saveGuessStats(slug: string, s: GuessStats) { safeWrite(KEYS.guessStats(slug), s) },
  feedKey(slug: string) { return KEYS.feed(slug) },
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
      roomId: 'open',
      hiddenMood: null,
      unlocks: [],
      activeDays: [],
    }
    storage.saveOwner(o)
  } else {
    // backfill missing fields from older shape
    let mutated = false
    if (!o.roomId) { o.roomId = 'open'; mutated = true }
    if (o.hiddenMood === undefined) { o.hiddenMood = null; mutated = true }
    if (!o.unlocks) { o.unlocks = []; mutated = true }
    if (!o.activeDays) { o.activeDays = []; mutated = true }
    if (mutated) storage.saveOwner(o)
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

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function activeDaysFromFeed(feed: FeedEntry[]): number {
  return new Set(feed.map((f) => dayKey(f.ts))).size
}
