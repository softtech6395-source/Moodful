import { motion } from 'framer-motion'

interface Props {
  onClick: () => void
}

/**
 * One-tap chaos button. Picks a random mood for the visitor.
 * Sits subtly under the mood selector — a "I don't know, surprise me" path.
 */
export default function RandomDrop({ onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="font-inter mt-5 inline-flex items-center gap-2 cursor-pointer mx-auto"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px dashed rgba(255,255,255,0.22)',
        borderRadius: 999,
        padding: '8px 16px',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--fg-muted)',
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ fontSize: 13 }}>🎲</span>
      <span>chaos mode · drop a random mood</span>
    </motion.button>
  )
}
