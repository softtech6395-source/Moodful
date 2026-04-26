import type { FeedEntry } from './store'
import type { MoodKey } from './moods'

export interface Achievement {
  id: string
  title: string
  desc: string
  icon: string
  /** returns true if unlocked given current state */
  test: (ctx: { feed: FeedEntry[]; guesses: { correct: number; total: number }; daysActive: number }) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-drop',
    title: 'First drop',
    desc: 'Receive your first mood.',
    icon: '✨',
    test: ({ feed }) => feed.length >= 1,
  },
  {
    id: 'rainbow',
    title: 'Full rainbow',
    desc: 'Receive at least one of every mood.',
    icon: '🌈',
    test: ({ feed }) => {
      const seen = new Set(feed.map((f) => f.mood as MoodKey))
      return seen.size >= 5
    },
  },
  {
    id: 'crowd',
    title: 'Small crowd',
    desc: 'Receive 10 moods.',
    icon: '👥',
    test: ({ feed }) => feed.length >= 10,
  },
  {
    id: 'plaza',
    title: 'A whole plaza',
    desc: 'Receive 50 moods.',
    icon: '🏛',
    test: ({ feed }) => feed.length >= 50,
  },
  {
    id: 'streak-3',
    title: '3-day streak',
    desc: 'Receive moods on three different days.',
    icon: '🔥',
    test: ({ daysActive }) => daysActive >= 3,
  },
  {
    id: 'mind-reader',
    title: 'Mind reader',
    desc: 'Have someone guess your secret mood correctly.',
    icon: '🔮',
    test: ({ guesses }) => guesses.correct >= 1,
  },
  {
    id: 'oracle',
    title: 'Oracle',
    desc: '10 correct guesses on your secret mood.',
    icon: '🪬',
    test: ({ guesses }) => guesses.correct >= 10,
  },
  {
    id: 'wordsmith',
    title: 'Wordsmith',
    desc: 'Receive 5 moods that include a written message.',
    icon: '✍️',
    test: ({ feed }) => feed.filter((f) => f.msg && f.msg.trim().length > 0).length >= 5,
  },
]

export function unlockedIds(ctx: Parameters<Achievement['test']>[0]): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(ctx)).map((a) => a.id)
}
