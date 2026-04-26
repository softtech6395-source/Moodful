import { motion } from 'framer-motion'
import type { Challenge } from '../lib/challenges'

interface Props {
  challenge: Challenge
  onDismiss: () => void
}

/**
 * Subtle pill-shaped banner under the nav. Tells visitors / owners about
 * today's challenge. Dismissible, but reappears on a new day.
 */
export default function ChallengeBanner({ challenge, onDismiss }: Props) {
  return (
    <motion.div
      className="mx-auto mb-4 flex items-center gap-3 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '8px 14px 8px 16px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maxWidth: 'min(100%, 640px)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45 }}
    >
      <span
        className="font-inter uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.28em',
          color: 'var(--fg-muted)',
          flexShrink: 0,
        }}
      >
        Today
      </span>
      <span
        className="font-inter font-semibold"
        style={{ fontSize: 13, color: 'var(--fg)', letterSpacing: '-0.005em' }}
      >
        {challenge.title}
      </span>
      <span
        className="font-inter hidden sm:inline truncate"
        style={{ fontSize: 12, color: 'var(--fg-muted)' }}
      >
        · {challenge.prompt}
      </span>
      <button
        onClick={onDismiss}
        className="ml-auto cursor-pointer flex-shrink-0"
        aria-label="Dismiss"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          color: 'var(--fg)',
          width: 22,
          height: 22,
          borderRadius: '50%',
          fontSize: 13,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </motion.div>
  )
}
