export interface MoodRoom {
  id: string
  label: string
  emoji: string
  prompt: string
  blurb: string
}

/**
 * Event-based mood rooms — set on the owner's page; visitors see this
 * prompt + theme instead of the default "How do you feel about me today?".
 */
export const ROOMS: MoodRoom[] = [
  {
    id: 'open',
    label: 'Open room',
    emoji: '◐',
    prompt: 'How do you feel about me today?',
    blurb: 'The default. Open-ended emotional check-in.',
  },
  {
    id: 'late-night',
    label: 'Late-night thoughts',
    emoji: '🌙',
    prompt: "It's late. What's loud in your head right now?",
    blurb: 'Soft, honest, low-key. Best after 10pm.',
  },
  {
    id: 'exam',
    label: 'Exam week',
    emoji: '📚',
    prompt: 'How is the studying treating you?',
    blurb: 'For the cramming, the panicking, the somehow-fines.',
  },
  {
    id: 'festival',
    label: 'Festival mode',
    emoji: '🎆',
    prompt: 'What is the festival doing to your nervous system?',
    blurb: 'Crowds, lights, family — drop the actual feeling.',
  },
  {
    id: 'monday',
    label: 'Monday energy',
    emoji: '☕',
    prompt: 'How is Monday landing on you?',
    blurb: 'A weekly check on whether the week is winning.',
  },
  {
    id: 'comeback',
    label: 'Big comeback',
    emoji: '🔥',
    prompt: "I'm building something back. Cheer me on?",
    blurb: 'For training arcs, recoveries, second tries.',
  },
]

export function getRoom(id: string | undefined): MoodRoom {
  return ROOMS.find((r) => r.id === id) ?? ROOMS[0]
}
