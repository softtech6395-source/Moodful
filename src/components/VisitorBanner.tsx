export default function VisitorBanner({ slug }: { slug: string }) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 font-inter uppercase"
      style={{
        top: 12,
        background: 'rgba(0,0,0,0.32)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '7px 14px',
        borderRadius: 999,
        fontSize: 11,
        letterSpacing: '0.18em',
        color: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      replying to · <span>{slug}</span>
    </div>
  )
}
