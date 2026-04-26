import { motion, AnimatePresence } from 'framer-motion'
import type { Mood } from '../lib/moods'

interface Props {
  isVisitor: boolean
  visitorSlug: string | null
  mood: Mood | null
  visitorPrompt: string | null
  guessGameOn: boolean
}

export default function Hero({ isVisitor, visitorSlug, mood, visitorPrompt, guessGameOn }: Props) {
  let icon = '·'
  let quote = 'Choose a mood. The room will adjust.'
  let sub = 'A small experiment in atmosphere — type, color, motion, and sound bend to how you feel right now.'
  let eyebrow = 'how are you feeling'

  if (isVisitor) {
    eyebrow = `replying to · @${visitorSlug ?? ''}`
    if (guessGameOn) {
      eyebrow = 'guess my mood'
      quote = "They've picked a secret mood. Can you read them?"
      sub = 'Pick the one you think they chose. Right or wrong, your mood still gets sent.'
    } else {
      quote = visitorPrompt || 'How do you feel today?'
      sub = 'Pick a feeling. Optional words. Stays anonymous.'
    }
    if (mood) icon = mood.emoji
  } else if (mood) {
    icon = mood.emoji
    quote = mood.quote
    sub = mood.sub
  }

  return (
    <>
      <div
        className="font-inter uppercase mb-5 inline-flex items-center gap-3.5"
        style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.32em', color: 'var(--fg-muted)' }}
      >
        <span className="block h-px w-7 opacity-60" style={{ background: 'var(--fg-muted)' }} />
        {eyebrow}
        <span className="block h-px w-7 opacity-60" style={{ background: 'var(--fg-muted)' }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={icon}
          className="mb-5 flex items-center justify-center select-none"
          style={{ fontSize: 'clamp(40px, 5vw, 56px)', height: 64, filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.35))' }}
          initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.6, opacity: 0, rotate: 8 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {icon}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.h1
          key={quote}
          className="font-mood mx-auto mb-5"
          style={{
            fontSize: 'clamp(28px, 5.4vw, 60px)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            maxWidth: '18ch',
            textWrap: 'balance' as const,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
        >
          {quote}
        </motion.h1>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.p
          key={sub}
          className="font-inter mx-auto mb-12"
          style={{
            fontSize: 'clamp(13px, 1.5vw, 16px)',
            fontWeight: 400,
            color: 'var(--fg-muted)',
            maxWidth: '46ch',
            lineHeight: 1.7,
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          {sub}
        </motion.p>
      </AnimatePresence>
    </>
  )
}
