import { motion } from 'framer-motion'

interface Props {
  funnyLine: string | null
  onAnother: () => void
  onCreateOwn: () => void
}

export default function SentCard({ funnyLine, onAnother, onCreateOwn }: Props) {
  return (
    <motion.div
      className="glass mx-auto mt-4 text-center"
      style={{ maxWidth: 480, borderRadius: 18, padding: '28px 24px' }}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
    >
      <div
        className="font-inter uppercase mb-2"
        style={{
          fontSize: 10,
          letterSpacing: '0.32em',
          color: 'var(--fg-muted)',
        }}
      >
        delivered
      </div>
      <h3 className="font-mood mb-2" style={{ fontSize: 24, color: 'var(--fg)' }}>
        Sent. Thank you.
      </h3>
      {funnyLine && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="font-inter mb-4 italic"
          style={{
            fontSize: 13,
            color: 'var(--fg-muted)',
            lineHeight: 1.6,
            maxWidth: '38ch',
            margin: '0 auto 18px',
          }}
        >
          “{funnyLine}”
        </motion.p>
      )}
      <p
        className="font-inter mb-4"
        style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6 }}
      >
        Want a mood page of your own? It takes nothing.
      </p>
      <div className="flex flex-wrap gap-2.5 justify-center">
        <button
          onClick={onCreateOwn}
          className="font-inter font-semibold tracking-wide rounded-lg cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.85)',
            color: 'rgba(0,0,0,0.85)',
            border: 'none',
            fontSize: 11,
            padding: '8px 16px',
            letterSpacing: '0.04em',
          }}
        >
          Create my mood page
        </button>
        <button
          onClick={onAnother}
          className="font-inter font-semibold tracking-wide rounded-lg cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'var(--fg)',
            fontSize: 11,
            padding: '8px 16px',
            letterSpacing: '0.04em',
          }}
        >
          Send another
        </button>
      </div>
    </motion.div>
  )
}
