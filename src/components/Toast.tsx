import { AnimatePresence, motion } from 'framer-motion'

export default function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ duration: 0.3 }}
          className="fixed left-1/2 z-[200] font-inter font-medium"
          style={{
            bottom: 28,
            background: 'rgba(20,22,32,0.92)',
            color: '#f5f5f7',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            fontSize: 13,
            padding: '11px 18px',
            borderRadius: 999,
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
