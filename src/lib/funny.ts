import type { MoodKey } from './moods'

const LINES: Record<MoodKey, string[]> = {
  happy: [
    'Your mood is now legally classified as sunshine.',
    'The frequency of joy has been added to the air.',
    'Their day just got 4% lighter. Not a big deal.',
    'A small dopamine pigeon has been dispatched.',
    'You just dropped a +1 vibe directly into their inbox.',
  ],
  sad: [
    'Your mood was delivered gently, in a soft envelope.',
    'No one is going to fix it. Someone is just going to know.',
    'Sent at the speed of one slow exhale.',
    'They will read this with the lights low.',
    'Your softness will be handled with care.',
  ],
  stressed: [
    'Your tightly-coiled mood has been delivered in a calming wrap.',
    'Your nervous system filed a small complaint. We forwarded it.',
    'A tiny breathing exercise rode along with this mood.',
    'They will receive this between two slow exhales.',
    'Your shoulders are technically allowed to drop now.',
  ],
  calm: [
    'The mood arrived already sitting cross-legged.',
    'Sent on a small green leaf, quietly.',
    'Their pulse just dropped two beats per minute. You did that.',
    'A cup of tea was implied.',
    'This mood arrives in airplane mode.',
  ],
  motivated: [
    "They just got a fresh shot of 'okay, fine, let's go'.",
    'Your mood arrived wearing tiny running shoes.',
    'Their browser tabs are about to feel scared.',
    'Productivity gremlins detected. Your mood is en route.',
    "Whatever was hard 12 minutes ago — you're 12 minutes closer to done.",
  ],
}

/**
 * Witty, mood-flavoured one-liner shown after a visitor sends.
 * Stable per-entry-id — so screenshots match what the visitor saw.
 */
export function funnyResponse(mood: MoodKey, seed: string): string {
  const set = LINES[mood]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return set[Math.abs(h) % set.length]
}
