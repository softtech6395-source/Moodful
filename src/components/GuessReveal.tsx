import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOODS, type MoodKey } from '../lib/moods'

interface Props {
  guess: MoodKey
  actual: MoodKey
  onDone: () => void
}

/**
 * Theatrical reveal after a visitor guesses the owner's secret mood.
 * Slot-machine style: shows ?? then their guess, then reveals the actual,
 * then announces correct / off.
 */
export default function GuessReveal({ guess, actual, onDone }: Props) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0)
  const correct = guess === actual

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 400),
      window.setTimeout(() => setStage(2), 1300),
      window.setTimeout(() => setStage(3), 2400),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])

  const guessMood = MOODS[guess]
  const actualMood = MOODS[actual]

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center px-6"
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <div
          className="font-inter uppercase mb-4"
          style={{
            fontSize: 11,
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          your guess vs. their secret
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
          <Slot label="your guess" mood={guessMood} reveal={stage >= 1} />
          <div
            className="font-inter"
            style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}
          >
            vs.
          </div>
          <Slot label="actual" mood={actualMood} reveal={stage >= 2} />
        </div>

        <AnimatePresence>
          {stage >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(24px, 5vw, 40px)',
                  letterSpacing: '-0.02em',
                  background: correct
                    ? 'linear-gradient(120deg, #7be09a, #FFE29F)'
                    : 'linear-gradient(120deg, #F4C4A1, #F72585)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {correct ? '🎯 nailed it' : '🌀 close, but no'}
              </div>
              <div
                className="font-inter max-w-[42ch] mx-auto"
                style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}
              >
                {correct
                  ? "You read them right. Your mood was sent — they'll see the receipt."
                  : 'Your mood still went through. Sometimes guessing wrong is the more honest answer.'}
              </div>
              <button
                onClick={onDone}
                className="font-inter font-semibold mt-2 cursor-pointer rounded-full"
                style={{
                  background: '#fff',
                  color: 'rgba(0,0,0,0.85)',
                  border: 'none',
                  fontSize: 13,
                  padding: '11px 22px',
                  letterSpacing: '0.02em',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
                }}
              >
                close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function Slot({ label, mood, reveal }: { label: string; mood: typeof MOODS[MoodKey]; reveal: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-2xl flex items-center justify-center overflow-hidden relative"
        style={{
          width: 'clamp(90px, 22vw, 130px)',
          height: 'clamp(90px, 22vw, 130px)',
          background: reveal
            ? `linear-gradient(135deg, ${mood.palette[0]}, ${mood.palette[1]})`
            : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: reveal ? '0 14px 32px rgba(0,0,0,0.35)' : 'none',
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
        }}
      >
        <AnimatePresence mode="wait">
          {reveal ? (
            <motion.div
              key="revealed"
              initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              style={{ fontSize: 'clamp(38px, 8vw, 56px)' }}
            >
              {mood.emoji}
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: 'rgba(255,255,255,0.7)' }}
            >
              ?
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div
        className="font-inter uppercase"
        style={{
          fontSize: 10,
          letterSpacing: '0.24em',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        {label}
      </div>
      {reveal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-jakarta capitalize"
          style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f7' }}
        >
          {mood.label}
        </motion.div>
      )}
    </div>
  )
}
