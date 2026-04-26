import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onSend: (msg: string) => void
  guessGameOn?: boolean
}

export default function Compose({ onSend, guessGameOn }: Props) {
  const [msg, setMsg] = useState('')
  return (
    <motion.div
      className="mx-auto w-full mt-7"
      style={{ maxWidth: 480 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          maxLength={120}
          placeholder={guessGameOn ? "anything you want them to read (optional)" : "add a few words (optional)"}
          className="glass flex-1 font-inter outline-none transition-all"
          style={{ fontSize: 14, padding: '13px 18px', borderRadius: 14, color: 'var(--fg)' }}
        />
        <button
          onClick={() => onSend(msg.trim())}
          className="font-inter font-bold tracking-wide rounded-[14px] transition-all active:scale-[0.97]"
          style={{
            background: 'var(--accent)',
            color: 'rgba(0,0,0,0.85)',
            fontSize: 14,
            padding: '0 22px',
            height: 48,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
          }}
        >
          {guessGameOn ? 'Lock in guess' : 'Send'}
        </button>
      </div>
      <div
        className="mt-2 font-inter"
        style={{ fontSize: 11, color: 'var(--fg-muted)', letterSpacing: '0.06em' }}
      >
        {guessGameOn
          ? "anonymous · their secret is revealed once you lock in"
          : "stays anonymous · they'll see your mood right away"}
      </div>
    </motion.div>
  )
}
