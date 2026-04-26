import { useEffect, useState } from 'react'
import { storage } from '../lib/store'

interface Props {
  isVisitor: boolean
  audioOn: boolean
  onAudioToggle: () => void
  onOpenDrawer: () => void
  ownerSlug: string
  onBrandClick: () => void
}

export default function Nav({ isVisitor, audioOn, onAudioToggle, onOpenDrawer, ownerSlug, onBrandClick }: Props) {
  const [unread, setUnread] = useState(0)

  // poll for unread count so the badge stays fresh
  useEffect(() => {
    const tick = () => {
      const list = storage.loadFeed(ownerSlug)
      setUnread(list.filter((f) => !f.seen).length)
    }
    tick()
    const id = window.setInterval(tick, 4000)
    const onStorage = (e: StorageEvent) => {
      if (e.key === storage.feedKey(ownerSlug)) tick()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('storage', onStorage)
    }
  }, [ownerSlug])

  return (
    <header className="flex items-center justify-between gap-3 pb-4">
      <div
        className="flex items-center gap-2.5 cursor-pointer select-none"
        onClick={onBrandClick}
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: 17,
          letterSpacing: '-0.02em',
          color: 'var(--fg)',
        }}
      >
        <span
          className="inline-block rounded-full"
          style={{
            width: 8,
            height: 8,
            background: 'var(--accent)',
            boxShadow: '0 0 14px var(--accent)',
            animation: 'pulseDot 3.4s ease-in-out infinite',
          }}
        />
        moodful
      </div>

      <div className="flex items-center gap-2.5">
        {!isVisitor && (
          <button
            onClick={onAudioToggle}
            className="glass rounded-full text-[12px] font-inter font-medium tracking-wide px-4 py-2.5 inline-flex items-center gap-2 transition-all hover:-translate-y-px"
            style={{ color: 'var(--fg)' }}
            aria-pressed={audioOn}
            title="Toggle ambient soundscape"
          >
            <span
              className="rounded-full transition-all"
              style={{
                width: 7,
                height: 7,
                background: audioOn ? 'var(--accent)' : 'var(--fg-muted)',
                boxShadow: audioOn ? '0 0 10px var(--accent)' : 'none',
              }}
            />
            <span>{audioOn ? 'Ambient on' : 'Ambient off'}</span>
          </button>
        )}
        <button
          onClick={onOpenDrawer}
          className="glass rounded-full text-[12px] font-inter font-medium tracking-wide px-4 py-2.5 inline-flex items-center gap-2 transition-all hover:-translate-y-px"
          style={{
            color: 'var(--fg)',
            background: 'rgba(255,255,255,0.18)',
            borderColor: 'rgba(255,255,255,0.34)',
          }}
        >
          <span>{isVisitor ? '+' : '◐'}</span>
          <span className="hidden sm:inline">{isVisitor ? 'Get my own page' : 'My mood page'}</span>
          {unread > 0 && !isVisitor && (
            <span
              className="text-[10px] font-bold rounded-md px-1.5 leading-tight"
              style={{
                background: 'var(--accent)',
                color: 'rgba(0,0,0,0.78)',
                minWidth: 16,
                textAlign: 'center',
              }}
            >
              {unread}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
