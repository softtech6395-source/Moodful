import { motion } from 'framer-motion'
import { MOODS, MOOD_KEYS, type MoodKey } from '../lib/moods'

interface Props {
  activeMood: MoodKey | null
  onSelect: (key: MoodKey, e: React.MouseEvent) => void
}

export default function MoodSelector({ activeMood, onSelect }: Props) {
  return (
    <motion.div
      className="flex flex-wrap justify-center gap-2.5 mt-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {MOOD_KEYS.map((key, i) => {
        const m = MOODS[key]
        const isActive = activeMood === key
        return (
          <motion.button
            key={key}
            onClick={(e) => onSelect(key, e)}
            className="glass inline-flex items-center gap-2.5 rounded-full font-inter font-medium select-none transition-all"
            style={{
              fontSize: 14,
              padding: '13px 26px',
              color: 'var(--fg)',
              background: isActive ? 'rgba(255,255,255,0.18)' : undefined,
              borderColor: isActive ? 'rgba(255,255,255,0.42)' : undefined,
              boxShadow: isActive ? '0 10px 32px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.1)' : undefined,
            }}
            whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.32)' }}
            whileTap={{ scale: 0.96 }}
            aria-label={`Set mood to ${m.label}`}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">
              {m.emoji}
            </span>
            <span>{m.label}</span>
            <span
              className="hidden sm:inline-block font-inter"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--fg-muted)',
                border: '1px solid var(--glass-border)',
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              {i + 1}
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
