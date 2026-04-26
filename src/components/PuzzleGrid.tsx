import { motion } from 'framer-motion'
import { MOODS } from '../lib/moods'
import type { FeedEntry } from '../lib/store'

interface Props {
  feed: FeedEntry[]
  size?: number  // grid is size x size
}

/**
 * The mood puzzle: a grid where each received mood fills the next cell.
 * Cells stay in chronological order so the grid tells the story of the
 * moods that have arrived.
 */
export default function PuzzleGrid({ feed, size = 5 }: Props) {
  const total = size * size
  const sorted = [...feed].sort((a, b) => a.ts - b.ts).slice(0, total)
  const cells = Array.from({ length: total }, (_, i) => sorted[i] ?? null)
  const filled = sorted.length
  const pct = Math.round((filled / total) * 100)

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          aspectRatio: '1 / 1',
        }}
      >
        {cells.map((entry, i) => {
          if (!entry) {
            return (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: 8,
                }}
              />
            )
          }
          const m = MOODS[entry.mood]
          return (
            <motion.div
              key={entry.id}
              initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: Math.min(i * 0.02, 0.3) }}
              title={`${m.label} · ${entry.msg || '—'}`}
              style={{
                background: `linear-gradient(135deg, ${m.palette[0]}, ${m.palette[1]})`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: m.fg,
                boxShadow: '0 4px 14px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {m.emoji}
            </motion.div>
          )
        })}
      </div>
      <div
        className="font-inter flex justify-between"
        style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(245,245,247,0.55)' }}
      >
        <span>{filled} / {total} cells filled</span>
        <span>{pct}% complete</span>
      </div>
    </div>
  )
}
