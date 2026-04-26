import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import { MOODS, REACTIONS, type ReactionId } from '../lib/moods'
import { storage, timeAgo, type Owner, type FeedEntry } from '../lib/store'

interface Props {
  open: boolean
  onClose: () => void
  owner: Owner
  onUpdateOwner: (next: Owner) => void
  onToast: (msg: string) => void
}

function ownerShareUrl(slug: string) {
  const u = new URL(window.location.href)
  u.search = ''
  u.hash = ''
  u.searchParams.set('m', slug)
  return u.toString()
}

export default function MoodDrawer({ open, onClose, owner, onUpdateOwner, onToast }: Props) {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [reacts, setReacts] = useState<Record<string, ReactionId | null>>({})
  const [prompt, setPrompt] = useState(owner.prompt)

  const shareLink = useMemo(() => ownerShareUrl(owner.slug), [owner.slug])

  // load feed on open + every 4s while open
  useEffect(() => {
    if (!open) return
    const tick = () => {
      const list = storage.loadFeed(owner.slug)
      // mark seen
      const next = list.map((f) => ({ ...f, seen: true }))
      storage.saveFeed(owner.slug, next)
      setFeed(next)
      setReacts(storage.loadReacts(owner.slug))
    }
    tick()
    const id = window.setInterval(tick, 4000)
    return () => window.clearInterval(id)
  }, [open, owner.slug])

  // render QR whenever drawer opens or slug changes
  useEffect(() => {
    if (!open) return
    const cnv = qrCanvasRef.current
    if (!cnv) return
    QRCode.toCanvas(
      cnv,
      shareLink,
      {
        width: 296,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f1218', light: '#ffffff' },
      },
      () => {},
    )
  }, [open, shareLink])

  // sync prompt input with owner
  useEffect(() => {
    setPrompt(owner.prompt)
  }, [owner.prompt])

  // stats
  const stats = useMemo(() => {
    const total = feed.length
    let dominantEmoji = '—'
    let dominantLabel = ''
    if (total) {
      const counts: Record<string, number> = {}
      feed.forEach((f) => { counts[f.mood] = (counts[f.mood] || 0) + 1 })
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      if (top) {
        const m = MOODS[top[0] as keyof typeof MOODS]
        dominantEmoji = m.emoji
        dominantLabel = m.label
      }
    }
    const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7
    const week = feed.filter((f) => f.ts >= weekAgo).length
    return { total, dominantEmoji, dominantLabel, week }
  }, [feed])

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

  const previewLink = () => {
    window.open(shareLink, '_blank')
  }

  const toggleReact = (entryId: string, r: ReactionId) => {
    const next = { ...reacts }
    next[entryId] = next[entryId] === r ? null : r
    setReacts(next)
    storage.saveReacts(owner.slug, next)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 bottom-0 right-0 z-[60] flex flex-col text-[#f5f5f7]"
            style={{
              width: 'min(440px, 92vw)',
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
            <div
              className="flex items-center justify-between"
              style={{
                padding: '22px 24px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
                Your mood page
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full inline-flex items-center justify-center cursor-pointer"
                style={{
                  width: 32,
                  height: 32,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f5f5f7',
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: '18px 24px 28px' }}>
              <SectionTitle first>Prompt visitors see</SectionTitle>
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

              <SectionTitle>Your emotional pulse</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                <Stat num={stats.total} label="total" />
                <Stat num={stats.dominantEmoji} label="dominant" title={stats.dominantLabel} />
                <Stat num={stats.week} label="this week" />
              </div>

              <SectionTitle>Live feed</SectionTitle>
              {feed.length === 0 ? (
                <div
                  className="text-center font-inter"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    padding: '24px 18px',
                    fontSize: 13,
                    color: 'rgba(245,245,247,0.5)',
                    lineHeight: 1.6,
                  }}
                >
                  <span className="block mb-2" style={{ fontSize: 24 }}>·</span>
                  No moods yet.<br />
                  Share your link or QR — they'll show up here in real time.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {feed
                    .slice()
                    .sort((a, b) => b.ts - a.ts)
                    .map((item) => {
                      const m = MOODS[item.mood]
                      const userReact = reacts[item.id]
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
                                width: 28,
                                height: 28,
                                background: m.palette[0],
                                fontSize: 14,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                              }}
                            >
                              {m.emoji}
                            </span>
                            <span
                              className="flex-1 font-jakarta capitalize"
                              style={{ fontWeight: 600, fontSize: 13.5 }}
                            >
                              {m.label}
                            </span>
                            <span
                              className="font-inter"
                              style={{ fontSize: 10.5, color: 'rgba(245,245,247,0.45)', letterSpacing: '0.04em' }}
                            >
                              {timeAgo(item.ts)}
                            </span>
                          </div>
                          {item.msg && (
                            <div
                              className="font-inter pl-[38px]"
                              style={{ fontSize: 13, color: 'rgba(245,245,247,0.78)', lineHeight: 1.55 }}
                            >
                              "{item.msg}"
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5 pl-[38px]">
                            {REACTIONS.map((r) => {
                              const isActive = userReact === r.id
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => toggleReact(item.id, r.id)}
                                  className="font-inter inline-flex items-center gap-1 rounded-full transition-all"
                                  style={{
                                    background: isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`,
                                    color: isActive ? '#f5f5f7' : 'rgba(245,245,247,0.7)',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    padding: '4px 9px',
                                    cursor: 'pointer',
                                  }}
                                  title={r.label}
                                >
                                  <span>{r.emoji}</span>
                                  <span>{r.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })}
                </div>
              )}

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
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SectionTitle({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div
      className="font-inter uppercase"
      style={{
        fontSize: 10,
        letterSpacing: '0.32em',
        color: 'rgba(245,245,247,0.55)',
        marginTop: first ? 6 : 22,
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

function Stat({ num, label, title }: { num: string | number; label: string; title?: string }) {
  return (
    <div
      className="text-center"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '12px 10px',
      }}
      title={title}
    >
      <div className="font-jakarta" style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>
        {num}
      </div>
      <div
        className="font-inter uppercase"
        style={{
          fontSize: 9.5,
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
