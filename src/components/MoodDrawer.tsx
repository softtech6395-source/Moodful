import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import { MOODS, MOOD_KEYS, REACTIONS, type MoodKey, type ReactionId } from '../lib/moods'
import { storage, timeAgo, activeDaysFromFeed, type Owner, type FeedEntry } from '../lib/store'
import { ROOMS, getRoom } from '../lib/rooms'
import { ACHIEVEMENTS, unlockedIds } from '../lib/achievements'
import { buildPersonality } from '../lib/personality'
import PuzzleGrid from './PuzzleGrid'

interface Props {
  open: boolean
  onClose: () => void
  owner: Owner
  onUpdateOwner: (next: Owner) => void
  onToast: (msg: string) => void
  onSendBack: (entry: FeedEntry, mood: MoodKey) => void
}

type TabId = 'share' | 'feed' | 'play' | 'pulse'

function ownerShareUrl(slug: string) {
  const u = new URL(window.location.href)
  u.search = ''
  u.hash = ''
  u.searchParams.set('m', slug)
  return u.toString()
}

export default function MoodDrawer({ open, onClose, owner, onUpdateOwner, onToast, onSendBack }: Props) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null!)
  const [tab, setTab] = useState<TabId>('share')
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [reacts, setReacts] = useState<Record<string, ReactionId | null>>({})
  const [prompt, setPrompt] = useState(owner.prompt)
  const [showSendBack, setShowSendBack] = useState<string | null>(null) // entry id

  const shareLink = useMemo(() => ownerShareUrl(owner.slug), [owner.slug])
  const room = getRoom(owner.roomId)
  const guessStats = useMemo(() => storage.loadGuessStats(owner.slug), [owner.slug, feed])

  // load feed on open + every 4s while open
  useEffect(() => {
    if (!open) return
    const tick = () => {
      const list = storage.loadFeed(owner.slug)
      const next = list.map((f) => ({ ...f, seen: true }))
      storage.saveFeed(owner.slug, next)
      setFeed(next)
      setReacts(storage.loadReacts(owner.slug))
    }
    tick()
    const id = window.setInterval(tick, 4000)
    return () => window.clearInterval(id)
  }, [open, owner.slug])

  // QR rendering — only in share tab when drawer is open
  useEffect(() => {
    if (!open || tab !== 'share') return
    const cnv = qrCanvasRef.current
    if (!cnv) return
    QRCode.toCanvas(
      cnv,
      shareLink,
      { width: 296, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f1218', light: '#ffffff' } },
      () => {},
    )
  }, [open, tab, shareLink])

  useEffect(() => { setPrompt(owner.prompt) }, [owner.prompt])

  const onPromptChange = (v: string) => {
    setPrompt(v)
    onUpdateOwner({ ...owner, prompt: v.trim() || 'How do you feel about me today?' })
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      onToast('Link copied')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareLink
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); onToast('Link copied') } catch { onToast('Copy failed') }
      ta.remove()
    }
  }

  const downloadQr = () => {
    const cnv = qrCanvasRef.current
    if (!cnv) return
    try {
      const data = cnv.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = data
      a.download = `moodful-${owner.slug}.png`
      a.click()
      onToast('QR downloaded')
    } catch {
      onToast('Download failed')
    }
  }

  const previewLink = () => window.open(shareLink, '_blank')

  const toggleReact = (entryId: string, r: ReactionId) => {
    const next = { ...reacts }
    next[entryId] = next[entryId] === r ? null : r
    setReacts(next)
    storage.saveReacts(owner.slug, next)
  }

  const setRoom = (id: string) => {
    const r = getRoom(id)
    onUpdateOwner({ ...owner, roomId: id, prompt: r.prompt })
    setPrompt(r.prompt)
    onToast(`Room: ${r.label}`)
  }

  const setHidden = (m: MoodKey | null) => {
    onUpdateOwner({ ...owner, hiddenMood: m })
    onToast(m ? `Secret mood set · ${MOODS[m].label}` : 'Guess game off')
  }

  const sendBack = (entry: FeedEntry, m: MoodKey) => {
    onSendBack(entry, m)
    setShowSendBack(null)
    // update local feed
    setFeed((prev) => prev.map((f) => f.id === entry.id ? { ...f, reply: { mood: m, ts: Date.now() } } : f))
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 bottom-0 right-0 z-[60] flex flex-col text-[#f5f5f7]"
            style={{
              width: 'min(460px, 96vw)',
              background: 'rgba(20,22,32,0.78)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(40px) saturate(160%)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <DrawerHead onClose={onClose} />
            <Tabs current={tab} onChange={setTab} feedCount={feed.length} />

            <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: '16px 22px 28px' }}>
              {tab === 'share' && (
                <ShareTab
                  prompt={prompt}
                  onPromptChange={onPromptChange}
                  shareLink={shareLink}
                  qrCanvasRef={qrCanvasRef}
                  copyLink={copyLink}
                  downloadQr={downloadQr}
                  previewLink={previewLink}
                  room={room}
                  onRoomChange={setRoom}
                />
              )}
              {tab === 'feed' && (
                <FeedTab
                  feed={feed}
                  reacts={reacts}
                  toggleReact={toggleReact}
                  showSendBack={showSendBack}
                  setShowSendBack={setShowSendBack}
                  sendBack={sendBack}
                />
              )}
              {tab === 'play' && (
                <PlayTab
                  hiddenMood={owner.hiddenMood ?? null}
                  setHidden={setHidden}
                  guessStats={guessStats}
                  feed={feed}
                />
              )}
              {tab === 'pulse' && <PulseTab feed={feed} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ---------- drawer head + tabs ---------- */

function DrawerHead({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '20px 22px 12px' }}
    >
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
        Your mood page
      </h2>
      <button
        onClick={onClose}
        aria-label="Close"
        className="rounded-full inline-flex items-center justify-center cursor-pointer"
        style={{
          width: 30, height: 30,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#f5f5f7',
          fontSize: 15,
        }}
      >
        ×
      </button>
    </div>
  )
}

function Tabs({ current, onChange, feedCount }: { current: TabId; onChange: (t: TabId) => void; feedCount: number }) {
  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'share', label: 'Share' },
    { id: 'feed', label: 'Feed', badge: feedCount },
    { id: 'play', label: 'Play' },
    { id: 'pulse', label: 'Pulse' },
  ]
  return (
    <div
      className="flex gap-1 mx-[22px] mb-1 p-1"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
      }}
    >
      {tabs.map((t) => {
        const active = current === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 font-inter relative cursor-pointer transition-colors"
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 6px',
              borderRadius: 8,
              border: 'none',
              background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: active ? '#f5f5f7' : 'rgba(245,245,247,0.6)',
              letterSpacing: '0.01em',
            }}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                  color: '#f5f5f7',
                  padding: '1px 5px',
                  borderRadius: 6,
                  lineHeight: 1.4,
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- SHARE TAB ---------- */

function ShareTab({
  prompt, onPromptChange, shareLink, qrCanvasRef, copyLink, downloadQr, previewLink, room, onRoomChange,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  shareLink: string
  qrCanvasRef: React.RefObject<HTMLCanvasElement>
  copyLink: () => void
  downloadQr: () => void
  previewLink: () => void
  room: ReturnType<typeof getRoom>
  onRoomChange: (id: string) => void
}) {
  return (
    <>
      <SectionTitle first>Mood room</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {ROOMS.map((r) => {
          const active = r.id === room.id
          return (
            <button
              key={r.id}
              onClick={() => onRoomChange(r.id)}
              className="text-left cursor-pointer transition-all"
              style={{
                background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12,
                padding: '10px 12px',
                color: '#f5f5f7',
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16 }}>{r.emoji}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5 }}>
                  {r.label}
                </span>
              </div>
              <div className="font-inter mt-1" style={{ fontSize: 10.5, color: 'rgba(245,245,247,0.55)', lineHeight: 1.45 }}>
                {r.blurb}
              </div>
            </button>
          )
        })}
      </div>

      <SectionTitle>Prompt visitors see</SectionTitle>
      <input
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        maxLength={80}
        className="w-full font-jakarta outline-none transition-colors"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '13px 16px',
          color: '#f5f5f7',
          fontSize: 15,
          fontWeight: 600,
        }}
      />

      <SectionTitle>Share link</SectionTitle>
      <div
        className="flex items-center gap-2.5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '10px 12px',
        }}
      >
        <span className="flex-1 font-inter break-all" style={{ fontSize: 12, color: 'rgba(245,245,247,0.85)', lineHeight: 1.4 }}>
          {shareLink}
        </span>
        <PillButton onClick={copyLink}>Copy</PillButton>
      </div>

      <div
        className="mt-3 flex flex-col items-center gap-3.5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          className="flex-shrink-0"
          style={{ background: '#fff', padding: 10, borderRadius: 12, lineHeight: 0, boxShadow: '0 8px 28px rgba(0,0,0,0.25)' }}
        >
          <canvas ref={qrCanvasRef} style={{ display: 'block', width: 148, height: 148 }} />
        </div>
        <div className="text-center font-inter" style={{ fontSize: 12, color: 'rgba(245,245,247,0.65)', lineHeight: 1.55 }}>
          <div style={{ color: '#f5f5f7', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
            Scan to share your mood page
          </div>
          Instagram, WhatsApp, a sticker — anywhere.
        </div>
        <div className="flex gap-2 justify-center w-full">
          <PillButton onClick={downloadQr}>Download QR</PillButton>
          <PillButton onClick={previewLink}>Preview link</PillButton>
        </div>
      </div>

      <DemoNote />
    </>
  )
}

/* ---------- FEED TAB ---------- */

function FeedTab({
  feed, reacts, toggleReact, showSendBack, setShowSendBack, sendBack,
}: {
  feed: FeedEntry[]
  reacts: Record<string, ReactionId | null>
  toggleReact: (id: string, r: ReactionId) => void
  showSendBack: string | null
  setShowSendBack: (id: string | null) => void
  sendBack: (entry: FeedEntry, m: MoodKey) => void
}) {
  if (feed.length === 0) {
    return (
      <div
        className="text-center font-inter mt-2"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '32px 18px',
          fontSize: 13,
          color: 'rgba(245,245,247,0.55)',
          lineHeight: 1.6,
        }}
      >
        <div className="mb-2" style={{ fontSize: 28 }}>·</div>
        No moods yet.<br />
        Share your link or QR — they'll show up here in real time.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {feed
        .slice()
        .sort((a, b) => b.ts - a.ts)
        .map((item) => {
          const m = MOODS[item.mood]
          const userReact = reacts[item.id]
          const showSb = showSendBack === item.id
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '12px 14px',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex items-center justify-center flex-shrink-0 rounded-full"
                  style={{
                    width: 28, height: 28,
                    background: m.palette[0],
                    fontSize: 14,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  }}
                >
                  {m.emoji}
                </span>
                <span className="flex-1 font-jakarta capitalize" style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {m.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.guess && (
                    <span
                      className="font-inter uppercase"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.16em',
                        background: item.guess.correct ? 'rgba(101,224,128,0.18)' : 'rgba(255,255,255,0.05)',
                        color: item.guess.correct ? '#7be09a' : 'rgba(245,245,247,0.55)',
                        padding: '2px 7px',
                        borderRadius: 999,
                      }}
                      title={`Guessed ${MOODS[item.guess.mood].label}`}
                    >
                      {item.guess.correct ? 'guess ✓' : 'guess ✗'}
                    </span>
                  )}
                  {item.random && (
                    <span
                      className="font-inter uppercase"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.16em',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(245,245,247,0.55)',
                        padding: '2px 7px',
                        borderRadius: 999,
                      }}
                    >
                      random
                    </span>
                  )}
                </div>
                <span className="font-inter" style={{ fontSize: 10.5, color: 'rgba(245,245,247,0.45)', letterSpacing: '0.04em' }}>
                  {timeAgo(item.ts)}
                </span>
              </div>
              {item.msg && (
                <div className="font-inter pl-[38px]" style={{ fontSize: 13, color: 'rgba(245,245,247,0.78)', lineHeight: 1.55 }}>
                  "{item.msg}"
                </div>
              )}

              {item.reply && (
                <div
                  className="font-inter pl-[38px] flex items-center gap-2"
                  style={{ fontSize: 12, color: 'rgba(245,245,247,0.6)', fontStyle: 'italic' }}
                >
                  <span>↩ you sent back {MOODS[item.reply.mood].emoji} {MOODS[item.reply.mood].label.toLowerCase()}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pl-[38px]">
                {REACTIONS.map((r) => {
                  const active = userReact === r.id
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleReact(item.id, r.id)}
                      className="font-inter inline-flex items-center gap-1 rounded-full transition-all cursor-pointer"
                      style={{
                        background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? '#f5f5f7' : 'rgba(245,245,247,0.7)',
                        fontSize: 11, fontWeight: 500, padding: '4px 9px',
                      }}
                      title={r.label}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  )
                })}
                {!item.reply && (
                  <button
                    onClick={() => setShowSendBack(showSb ? null : item.id)}
                    className="font-inter inline-flex items-center gap-1 rounded-full transition-all cursor-pointer"
                    style={{
                      background: showSb ? 'rgba(247,37,133,0.22)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${showSb ? 'rgba(247,37,133,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      color: '#f5f5f7',
                      fontSize: 11, fontWeight: 500, padding: '4px 9px',
                    }}
                  >
                    {showSb ? 'pick mood ↓' : '↩ send back'}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showSb && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-wrap gap-1.5 pl-[38px] overflow-hidden"
                  >
                    {MOOD_KEYS.map((k) => {
                      const mm = MOODS[k]
                      return (
                        <button
                          key={k}
                          onClick={() => sendBack(item, k)}
                          className="font-inter inline-flex items-center gap-1 rounded-full cursor-pointer transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#f5f5f7',
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '4px 10px',
                          }}
                        >
                          <span>{mm.emoji}</span>
                          <span>{mm.label.toLowerCase()}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
    </div>
  )
}

/* ---------- PLAY TAB ---------- */

function PlayTab({
  hiddenMood, setHidden, guessStats, feed,
}: {
  hiddenMood: MoodKey | null
  setHidden: (m: MoodKey | null) => void
  guessStats: { correct: number; total: number }
  feed: FeedEntry[]
}) {
  const accuracy = guessStats.total > 0 ? Math.round((guessStats.correct / guessStats.total) * 100) : 0
  const ctx = {
    feed,
    guesses: guessStats,
    daysActive: activeDaysFromFeed(feed),
  }
  const unlocked = new Set(unlockedIds(ctx))

  return (
    <>
      <SectionTitle first>Guess my mood</SectionTitle>
      <div
        className="font-inter mb-3"
        style={{ fontSize: 12, color: 'rgba(245,245,247,0.62)', lineHeight: 1.55 }}
      >
        Pick a secret mood. Visitors get a guess prompt; correct guesses
        celebrate, wrong ones still get sent. Tap a mood to set it. Tap
        again to switch off.
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {MOOD_KEYS.map((k) => {
          const mm = MOODS[k]
          const active = hiddenMood === k
          return (
            <button
              key={k}
              onClick={() => setHidden(active ? null : k)}
              className="font-inter inline-flex items-center gap-1.5 rounded-full cursor-pointer transition-all"
              style={{
                background: active ? `linear-gradient(135deg, ${mm.palette[0]}, ${mm.palette[1]})` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.1)'}`,
                color: active ? mm.fg : '#f5f5f7',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '7px 13px',
                boxShadow: active ? '0 8px 22px rgba(0,0,0,0.25)' : 'none',
              }}
            >
              <span>{mm.emoji}</span>
              <span>{mm.label}</span>
            </button>
          )
        })}
      </div>
      {hiddenMood && (
        <div
          className="font-inter mb-3"
          style={{
            background: 'rgba(247,37,133,0.1)',
            border: '1px solid rgba(247,37,133,0.32)',
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: 12,
            color: '#fbeee4',
            lineHeight: 1.55,
          }}
        >
          🎯 Game on. Visitors see a "guess my mood" prompt instead of the regular selector.
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <Stat num={guessStats.total} label="guesses" />
        <Stat num={guessStats.correct} label="correct" />
        <Stat num={`${accuracy}%`} label="accuracy" />
      </div>

      <SectionTitle>Achievements</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id)
          return (
            <div
              key={a.id}
              style={{
                background: got ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${got ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12,
                padding: '10px 12px',
                opacity: got ? 1 : 0.55,
                position: 'relative',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 16, filter: got ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12.5 }}>
                  {a.title}
                </span>
                {got && (
                  <span
                    className="ml-auto font-inter"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#7be09a',
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="font-inter" style={{ fontSize: 10.5, color: 'rgba(245,245,247,0.6)', lineHeight: 1.45 }}>
                {a.desc}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ---------- PULSE TAB ---------- */

function PulseTab({ feed }: { feed: FeedEntry[] }) {
  const personality = useMemo(() => buildPersonality(feed), [feed])

  // top stats
  const total = feed.length
  let dominant = '—'
  if (total) {
    const counts: Record<string, number> = {}
    feed.forEach((f) => { counts[f.mood] = (counts[f.mood] || 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (top) dominant = MOODS[top[0] as MoodKey].emoji
  }
  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7
  const week = feed.filter((f) => f.ts >= weekAgo).length
  const days = activeDaysFromFeed(feed)

  return (
    <>
      <SectionTitle first>Your emotional aura</SectionTitle>
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: '#f5f5f7',
            marginBottom: 4,
            letterSpacing: '-0.01em',
          }}
        >
          {personality.archetype}
        </div>
        <div className="font-inter" style={{ fontSize: 12.5, color: 'rgba(245,245,247,0.7)', lineHeight: 1.55 }}>
          {personality.tagline}
        </div>
        {feed.length > 0 && (
          <div className="flex gap-1 mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {(Object.keys(personality.ratios) as MoodKey[]).map((k) => {
              const ratio = personality.ratios[k]
              if (ratio === 0) return null
              const m = MOODS[k]
              return (
                <div
                  key={k}
                  title={`${m.label} · ${Math.round(ratio * 100)}%`}
                  style={{
                    flex: ratio,
                    background: m.palette[0],
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      <SectionTitle>Pulse stats</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        <Stat num={total} label="total" />
        <Stat num={dominant} label="dominant" />
        <Stat num={week} label="this week" />
        <Stat num={days} label="active days" />
      </div>

      <SectionTitle>Mood puzzle</SectionTitle>
      <PuzzleGrid feed={feed} />
    </>
  )
}

/* ---------- shared bits ---------- */

function SectionTitle({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div
      className="font-inter uppercase"
      style={{
        fontSize: 10,
        letterSpacing: '0.32em',
        color: 'rgba(245,245,247,0.55)',
        marginTop: first ? 12 : 22,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  )
}

function PillButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-inter cursor-pointer transition-all active:scale-[0.96]"
      style={{
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.14)',
        color: '#f5f5f7',
        fontSize: 11,
        fontWeight: 600,
        padding: '7px 12px',
        borderRadius: 8,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function Stat({ num, label }: { num: string | number; label: string }) {
  return (
    <div
      className="text-center"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '12px 8px',
      }}
    >
      <div className="font-jakarta" style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>{num}</div>
      <div
        className="font-inter uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.18em',
          color: 'rgba(245,245,247,0.5)',
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function DemoNote() {
  return (
    <div
      className="mt-5 font-inter"
      style={{
        fontSize: 11,
        color: 'rgba(245,245,247,0.4)',
        lineHeight: 1.6,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      Demo mode · entries are stored on this device. In production they'd sync across visitors in real time.
    </div>
  )
}
