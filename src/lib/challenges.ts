import type { MoodKey } from './moods'

export interface Challenge {
  id: string
  title: string
  prompt: string
  hint: string
  /** if set, only this mood counts for the challenge */
  moodLock?: MoodKey
}

const POOL: Challenge[] = [
  { id: 'monday-mood', title: 'Monday Mood', prompt: 'Tell them how Monday hit you.', hint: 'no wrong answers, just honest ones' },
  { id: 'one-word', title: 'One-word mood', prompt: 'Send a mood with exactly one word attached.', hint: 'less is more' },
  { id: 'emoji-only', title: 'Emoji-only mood', prompt: 'Skip the words. Pick a mood, no message.', hint: 'pure vibe' },
  { id: 'gratitude', title: 'Tiny gratitude', prompt: 'Send happy + one small thing you noticed today.', hint: 'a coffee, a sky, a song' },
  { id: 'bedside', title: 'Late-night thought', prompt: "Send what's on your mind right before bed.", hint: 'softness allowed' },
  { id: 'three-words', title: 'Three honest words', prompt: 'Pick a mood. Three-word message. No more.', hint: 'edit ruthlessly' },
  { id: 'opposite', title: 'Opposite day', prompt: "Send the mood you wish you didn't have.", hint: 'the unflattering one' },
  { id: 'reset', title: 'Sunday reset', prompt: 'Send the mood that closes your week.', hint: 'whatever it is' },
  { id: 'unfiltered', title: 'Unfiltered', prompt: 'No filter. No edit. First mood that comes up.', hint: '5 seconds, then send' },
  { id: 'small-win', title: 'Small win', prompt: 'Motivated + one thing you did today, however tiny.', hint: 'made the bed counts' },
  { id: 'someone-else', title: 'About someone', prompt: 'Send a mood that someone else gave you today.', hint: 'kind, hard, or strange' },
  { id: 'weather', title: 'Weather report', prompt: 'Match your mood to the weather outside.', hint: 'rain inside, sun outside?' },
]

/**
 * Deterministic challenge for any given calendar date — so everyone on the
 * same day sees the same prompt, and tomorrow it rotates.
 */
export function challengeForDate(d = new Date()): Challenge {
  const stamp = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  let h = 0
  for (let i = 0; i < stamp.length; i++) h = ((h << 5) - h + stamp.charCodeAt(i)) | 0
  return POOL[Math.abs(h) % POOL.length]
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
