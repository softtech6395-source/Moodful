import type { Mood } from '../lib/moods'

interface Props {
  mood: Mood | null
}

export default function Meta({ mood }: Props) {
  const palette = mood?.palette ?? ['#11131a', '#1a1d2b', '#232636']
  return (
    <footer
      className="grid gap-6 pt-7"
      style={{ gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'end' }}
    >
      <Cell label="Mood" align="left">
        {mood ? `${mood.emoji} · ${mood.label.toLowerCase()}` : '— · neutral'}
      </Cell>
      <Cell label="Tempo" align="center">
        {mood?.tempo ?? 'stillness'}
      </Cell>
      <Cell label="Palette" align="right">
        <span className="flex gap-1.5">
          {palette.map((c, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 14,
                height: 14,
                background: c,
                border: '1px solid rgba(255,255,255,0.18)',
                transition: 'background 0.6s ease',
              }}
            />
          ))}
        </span>
      </Cell>
    </footer>
  )
}

function Cell({
  label,
  children,
  align,
}: {
  label: string
  children: React.ReactNode
  align: 'left' | 'center' | 'right'
}) {
  const itemsClass = align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'
  return (
    <div className={`flex flex-col gap-1.5 ${itemsClass}`}>
      <span
        className="font-inter uppercase"
        style={{
          fontSize: 10,
          letterSpacing: '0.32em',
          color: 'var(--fg-muted)',
          opacity: 0.7,
        }}
      >
        {label}
      </span>
      <span
        className="font-mood"
        style={{ fontSize: 15, color: 'var(--fg)', letterSpacing: '-0.01em' }}
      >
        {children}
      </span>
    </div>
  )
}
