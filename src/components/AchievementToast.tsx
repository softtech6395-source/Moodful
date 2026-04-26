import { AnimatePresence, motion } from 'framer-motion'
import type { Achievement } from '../lib/achievements'

interface Props {
  achievement: Achievement | null
}

/**
 * Slides in from the right when a new achievement is unlocked.
 * App.tsx detects new unlocks by diffing previous vs current sets and
 * pumps them through this component one at a time.
 */
export default function AchievementToast({ achievement }: Props) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, x: 60, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="fixed flex items-center gap-3"
          style={{
            top: 24,
            right: 24,
            zIndex: 220,
            background: 'rgba(20,22,32,0.92)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 14,
            padding: '12px 16px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
            maxWidth: 320,
          }}
        >
          <span
            className="rounded-full inline-flex items-center justify-center flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #F72585, #7209B7)',
              fontSize: 18,
              boxShadow: '0 6px 18px rgba(247,37,133,0.4)',
            }}
          >
            {achievement.icon}
          </span>
          <div className="flex-1">
            <div
              className="font-inter uppercase"
              style={{
                fontSize: 9.5,
                letterSpacing: '0.22em',
                color: 'rgba(245,245,247,0.55)',
                marginBottom: 2,
              }}
            >
              Unlocked
            </div>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: '#f5f5f7',
                lineHeight: 1.2,
              }}
            >
              {achievement.title}
            </div>
            <div
              className="font-inter"
              style={{
                fontSize: 11.5,
                color: 'rgba(245,245,247,0.65)',
                lineHeight: 1.4,
                marginTop: 2,
              }}
            >
              {achievement.desc}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
