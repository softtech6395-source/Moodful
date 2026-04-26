import { useEffect, useMemo, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MOODS, MOOD_KEYS, type MoodKey } from './lib/moods'
import { ensureOwner, storage, type Owner, type FeedEntry } from './lib/store'
import { useAudio } from './hooks/useAudio'
import { useToast } from './hooks/useToast'

import ParticleCanvas from './components/ParticleCanvas'
import Orbs from './components/Orbs'
import Nav from './components/Nav'
import Hero from './components/Hero'
import MoodSelector from './components/MoodSelector'
import Compose from './components/Compose'
import SentCard from './components/SentCard'
import Meta from './components/Meta'
import MoodDrawer from './components/MoodDrawer'
import Toast from './components/Toast'
import VisitorBanner from './components/VisitorBanner'

export default function App() {
  // ---- routing ----
  const visitSlug = useMemo(() => {
    return new URLSearchParams(window.location.search).get('m')
  }, [])
  const isVisitor = !!visitSlug

  // ---- state ----
  const [owner, setOwner] = useState<Owner>(() => ensureOwner())
  const [activeMood, setActiveMood] = useState<MoodKey | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const { message: toastMessage, show: showToast } = useToast()

  const currentMood = activeMood ? MOODS[activeMood] : null
  const { audioOn, toggle: toggleAudio } = useAudio(currentMood?.audio ?? null)

  // ---- visitor prompt (read owner's prompt if same device) ----
  const visitorPrompt = useMemo(() => {
    if (!isVisitor) return null
    const o = storage.loadOwner()
    if (o && o.slug === visitSlug && o.prompt) return o.prompt
    return 'How do you feel today?'
  }, [isVisitor, visitSlug])

  // ---- apply theme ----
  useEffect(() => {
    const root = document.documentElement
    if (currentMood) {
      root.style.setProperty('--c1', currentMood.palette[0])
      root.style.setProperty('--c2', currentMood.palette[1])
      root.style.setProperty('--c3', currentMood.palette[2])
      root.style.setProperty('--accent', currentMood.accent)
      root.style.setProperty('--fg', currentMood.fg)
      root.style.setProperty('--fg-muted', currentMood.fgMuted)
      root.style.setProperty('--font', currentMood.font)
      root.style.setProperty('--font-weight', String(currentMood.weight))
      document.body.style.background = `linear-gradient(140deg, ${currentMood.palette[0]}, ${currentMood.palette[1]} 45%, ${currentMood.palette[2]})`
      document.body.style.backgroundSize = '220% 220%'
    }
  }, [currentMood])

  // ---- visitor mode body class ----
  useEffect(() => {
    document.body.classList.toggle('is-visitor', isVisitor)
  }, [isVisitor])

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const i = parseInt(e.key, 10) - 1
      if (i >= 0 && i < MOOD_KEYS.length) {
        setActiveMood(MOOD_KEYS[i])
        return
      }
      if (e.key === 's' || e.key === 'S') toggleAudio()
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleAudio])

  // ---- click ripple ----
  const handleMoodSelect = useCallback((key: MoodKey, e: React.MouseEvent) => {
    setActiveMood(key)
    const ring = document.createElement('div')
    ring.style.cssText = `position:fixed;left:${e.clientX - 2}px;top:${e.clientY - 2}px;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.55);box-shadow:0 0 0 0 rgba(255,255,255,0.45);z-index:999;pointer-events:none;animation:ringPulse 1s cubic-bezier(0.16,1,0.3,1) forwards`
    document.body.appendChild(ring)
    window.setTimeout(() => ring.remove(), 1100)
  }, [])

  // ---- visitor submit ----
  const submitMood = useCallback(
    (msg: string) => {
      if (!activeMood || !visitSlug) return
      const entry: FeedEntry = {
        id: Math.random().toString(36).slice(2, 10),
        mood: activeMood,
        msg: msg.slice(0, 120),
        ts: Date.now(),
        seen: false,
      }
      const list = storage.loadFeed(visitSlug)
      list.push(entry)
      storage.saveFeed(visitSlug, list)
      setSent(true)
      showToast('Mood delivered')
    },
    [activeMood, visitSlug, showToast],
  )

  const updateOwner = useCallback((next: Owner) => {
    setOwner(next)
    storage.saveOwner(next)
  }, [])

  const goToOwnHome = () => {
    const u = new URL(window.location.href)
    u.searchParams.delete('m')
    window.location.href = u.toString()
  }

  return (
    <>
      <ParticleCanvas particles={currentMood?.particles ?? null} />
      <Orbs />
      {isVisitor && <VisitorBanner slug={visitSlug!} />}

      <div className="relative z-[5] flex h-screen flex-col px-[clamp(20px,6vw,80px)] py-[clamp(20px,3vw,36px)] overflow-hidden">
        <Nav
          isVisitor={isVisitor}
          audioOn={audioOn}
          onAudioToggle={toggleAudio}
          onOpenDrawer={() => setDrawerOpen(true)}
          ownerSlug={owner.slug}
          onBrandClick={() => { if (isVisitor) goToOwnHome() }}
        />

        <main className="flex flex-1 flex-col items-center justify-center text-center min-h-0 py-4">
          <Hero
            isVisitor={isVisitor}
            visitorSlug={visitSlug}
            mood={currentMood}
            visitorPrompt={visitorPrompt}
          />

          <AnimatePresence mode="wait">
            {!sent && (
              <MoodSelector
                key="selector"
                activeMood={activeMood}
                onSelect={handleMoodSelect}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isVisitor && activeMood && !sent && (
              <Compose key="compose" onSend={submitMood} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {sent && (
              <SentCard
                key="sent"
                onAnother={() => { setSent(false); setActiveMood(null) }}
                onCreateOwn={goToOwnHome}
              />
            )}
          </AnimatePresence>
        </main>

        <Meta mood={currentMood} />
      </div>

      <MoodDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        owner={owner}
        onUpdateOwner={updateOwner}
        onToast={showToast}
      />

      <Toast message={toastMessage} />
    </>
  )
}
