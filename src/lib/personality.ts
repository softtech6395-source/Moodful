import { MOODS, type MoodKey } from './moods'
import type { FeedEntry } from './store'

export interface Personality {
  archetype: string
  tagline: string
  dominantMood: MoodKey | null
  ratios: Record<MoodKey, number>
}

const ARCHETYPES: Record<string, { archetype: string; tagline: string }> = {
  // dominant -> archetype
  happy: { archetype: 'The warm room', tagline: 'People drop their guard around you.' },
  sad: { archetype: 'The soft witness', tagline: 'You make hard things sayable.' },
  stressed: { archetype: 'The pressure mirror', tagline: 'You hold weight without flinching.' },
  calm: { archetype: 'The slow signal', tagline: 'You decelerate the room.' },
  motivated: { archetype: 'The starting gun', tagline: "You're who people text before they begin." },
}

export function buildPersonality(feed: FeedEntry[]): Personality {
  const ratios: Record<MoodKey, number> = {
    happy: 0, sad: 0, stressed: 0, calm: 0, motivated: 0,
  }
  if (!feed.length) {
    return {
      archetype: '— · neutral observer',
      tagline: 'Share your link to start receiving moods.',
      dominantMood: null,
      ratios,
    }
  }
  for (const f of feed) ratios[f.mood] += 1
  const total = feed.length
  ;(Object.keys(ratios) as MoodKey[]).forEach((k) => { ratios[k] = ratios[k] / total })

  let dominant: MoodKey = 'calm'
  let max = -1
  for (const k of Object.keys(ratios) as MoodKey[]) {
    if (ratios[k] > max) { max = ratios[k]; dominant = k }
  }

  const a = ARCHETYPES[dominant]
  return {
    archetype: `${MOODS[dominant].emoji} ${a.archetype}`,
    tagline: a.tagline,
    dominantMood: dominant,
    ratios,
  }
}
