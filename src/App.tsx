import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MOODS, MOOD_KEYS, type MoodKey } from './lib/moods'
import { ensureOwner, storage, type Owner, type FeedEntry } from './lib/store'
import { challengeForDate, todayKey } from './lib/challenges'
import { funnyResponse } from './lib/funny'
import { ACHIEVEMENTS, unlockedIds } from './lib/achievements'
import { activeDaysFromFeed } from './lib/store'
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
import ChallengeBanner from './components/ChallengeBanner'
import AchievementToast from './components/AchievementToast'
import RandomDrop from './components/RandomDrop'
import GuessReveal from './components/GuessReveal'

const CHALLENGE_DISMISS_KEY = 'moodful.challenge.dismissed'

export default function App() {
  /* ---- routing ---- */
  const visitSlug = useMemo(
    () => new URLSearchParams(window.location.search).get('m'),
    [],
  )
  const isVisitor = !!visitSlug

  /* ---- state ---- */
  const [owner, setOwner] = useState<Owner>(() => ensureOwner())
  const [activeMood, setActiveMood] = useState<MoodKey | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [funnyLine, setFunnyLine] = useState<string | null>(null)
  const [challengeDismissedKey, setChallengeDismissedKey] = useState<string>(() => localStorage.getItem(CHALLENGE_DISMISS_KEY) ?? '')
  const [pendingGuess, setPendingGuess] = useState<{ guess: MoodKey; actual: MoodKey } | null>(null)
  const [unlockedToast, setUnlockedToast] = useState<typeof ACHIEVEMENTS[number] | null>(null)
  const previousUnlocksRef = useRef<Set<string>>(new Set(owner.unlocks ?? []))
  const { message: toastMessage, show: showToast } = useToast()

  const currentMood = activeMood ? MOODS[activeMood] : null
  const { audioOn, toggle: toggleAudio } = useAudio(currentMood?.audio ?? null)

  /* ---- visitor: read owner's prompt + guess-game flag from same-device store ---- */
  const visitorContext = useMemo(() => {
    if (!isVisitor) return { prompt: null, guessGameOn: false, hiddenMood: null as MoodKey | null }
    const o = storage.loadOwner()
    if (o && o.slug === visitSlug) {
      return { prompt: o.prompt, guessGameOn: !!o.hiddenMood, hiddenMood: o.hiddenMood ?? null }
    }
    return { prompt: 'How do you feel today?', guessGameOn: false, hiddenMood: null }
  }, [isVisitor, visitSlug])

  /* ---- daily challenge ---- */
  const todaysChallenge = useMemo(() => challengeForDate(), [])
  const today = todayKey()
  const challengeVisible = challengeDismissedKey !== today

  const dismissChallenge = () => {
    localStorage.setItem(CHALLENGE_DISMISS_KEY, today)
    setChallengeDismissedKey(today)
  }

  /* ---- apply theme ---- */
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

  useEffect(() => {
    document.body.classList.toggle('is-visitor', isVisitor)
  }, [isVisitor])

  /* ---- keyboard shortcuts ---- */
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

  /* ---- click ripple ---- */
  const handleMoodSelect = useCallback((key: MoodKey, e: React.MouseEvent) => {
    setActiveMood(key)
    const ring = document.createElement('div')
    ring.style.cssText = `position:fixed;left:${e.clientX - 2}px;top:${e.clientY - 2}px;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.55);box-shadow:0 0 0 0 rgba(255,255,255,0.45);z-index:999;pointer-events:none;animation:ringPulse 1s cubic-bezier(0.16,1,0.3,1) forwards`
    document.body.appendChild(ring)
    window.setTimeout(() => ring.remove(), 1100)
  }, [])

  /* ---- random mood drop (visitor) ---- */
  const handleRandomDrop = useCallback(() => {
    const k = MOOD_KEYS[Math.floor(Math.random() * MOOD_KEYS.length)]
    setActiveMood(k)
    showToast(`🎲 random: ${MOODS[k].label.toLowerCase()}`)
  }, [showToast])

  /* ---- visitor submit ---- */
  const submitMood = useCallback(
    (msg: string) => {
      if (!activeMood || !visitSlug) return
      const isGuessGame = visitorContext.guessGameOn && visitorContext.hiddenMood
      const correct = isGuessGame && activeMood === visitorContext.hiddenMood
      const id = Math.random().toString(36).slice(2, 10)
      const entry: FeedEntry = {
        id,
        mood: activeMood,
        msg: msg.slice(0, 120),
        ts: Date.now(),
        seen: false,
        guess: isGuessGame
          ? { mood: activeMood, correct: !!correct }
          : null,
        random: false,
      }
      const list = storage.loadFeed(visitSlug)
      list.push(entry)
      storage.saveFeed(visitSlug, list)

      // update guess stats on owner side (still local — this works because
      // owner & visitor often share a device in demo mode)
      if (isGuessGame) {
        const stats = storage.loadGuessStats(visitSlug)
        stats.total += 1
        if (correct) stats.correct += 1
        storage.saveGuessStats(visitSlug, stats)
      }

      setFunnyLine(funnyResponse(activeMood, id))

      if (isGuessGame && visitorContext.hiddenMood) {
        setPendingGuess({ guess: activeMood, actual: visitorContext.hiddenMood })
        // delay sent state until reveal closes
      } else {
        setSent(true)
        showToast('Mood delivered')
      }
    },
    [activeMood, visitSlug, visitorContext, showToast],
  )

  /* ---- send mood back (owner) ---- */
  const sendMoodBack = useCallback((entry: FeedEntry, mood: MoodKey) => {
    const list = storage.loadFeed(owner.slug).map((f) =>
      f.id === entry.id ? { ...f, reply: { mood, ts: Date.now() } } : f,
    )
    storage.saveFeed(owner.slug, list)
    showToast(`↩ sent ${MOODS[mood].label.toLowerCase()} back`)
  }, [owner.slug, showToast])

  /* ---- update owner ---- */
  const updateOwner = useCallback((next: Owner) => {
    setOwner(next)
    storage.saveOwner(next)
  }, [])

  /* ---- watch for new achievements ---- */
  useEffect(() => {
    if (isVisitor) return
    const tick = () => {
      const feed = storage.loadFeed(owner.slug)
      const guessStats = storage.loadGuessStats(owner.slug)
      const ids = unlockedIds({ feed, guesses: guessStats, daysActive: activeDaysFromFeed(feed) })
      const set = new Set(ids)
      const prev = previousUnlocksRef.current
      const newOnes = ids.filter((id) => !prev.has(id))
      if (newOnes.length > 0) {
        const def = ACHIEVEMENTS.find((a) => a.id === newOnes[0])
        if (def) {
          setUnlockedToast(def)
          window.setTimeout(() => setUnlockedToast(null), 4500)
        }
        // persist all unlocks
        updateOwner({ ...owner, unlocks: ids })
      }
      previousUnlocksRef.current = set
    }
    tick()
    const id = window.setInterval(tick, 4000)
    return () => window.clearInterval(id)
  }, [isVisitor, owner, updateOwner])

  const goToOwnHome = () => {
    const u = new URL(window.location.href)
    u.searchParams.delete('m')
    window.location.href = u.toString()
  }

  const onGuessRevealDone = () => {
    setPendingGuess(null)
    setSent(true)
    showToast('Mood delivered')
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

        <AnimatePresence>
          {challengeVisible && (
            <ChallengeBanner challenge={todaysChallenge} onDismiss={dismissChallenge} />
          )}
        </AnimatePresence>

        <main className="flex flex-1 flex-col items-center justify-center text-center min-h-0 py-4">
          <Hero
            isVisitor={isVisitor}
            visitorSlug={visitSlug}
            mood={currentMood}
            visitorPrompt={visitorContext.prompt}
            guessGameOn={visitorContext.guessGameOn}
          />

          <AnimatePresence mode="wait">
            {!sent && !pendingGuess && (
              <MoodSelector key="selector" activeMood={activeMood} onSelect={handleMoodSelect} />
            )}
          </AnimatePresence>

          {isVisitor && !sent && !pendingGuess && !activeMood && (
            <RandomDrop onClick={handleRandomDrop} />
          )}

          <AnimatePresence>
            {isVisitor && activeMood && !sent && !pendingGuess && (
              <Compose
                key="compose"
                onSend={submitMood}
                guessGameOn={visitorContext.guessGameOn}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {sent && (
              <SentCard
                key="sent"
                funnyLine={funnyLine}
                onAnother={() => {
                  setSent(false)
                  setActiveMood(null)
                  setFunnyLine(null)
                }}
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
        onSendBack={sendMoodBack}
      />

      <AchievementToast achievement={unlockedToast} />

      <AnimatePresence>
        {pendingGuess && (
          <GuessReveal
            guess={pendingGuess.guess}
            actual={pendingGuess.actual}
            onDone={onGuessRevealDone}
          />
        )}
      </AnimatePresence>

      <Toast message={toastMessage} />
    </>
  )
}
