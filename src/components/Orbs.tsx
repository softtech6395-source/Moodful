export default function Orbs() {
  return (
    <>
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: '55vw',
          height: '55vw',
          top: '-12vw',
          left: '-12vw',
          background: 'var(--c2)',
          filter: 'blur(90px)',
          opacity: 0.55,
          zIndex: 0,
          transition: 'background 1.4s ease, opacity 1.4s ease',
          willChange: 'transform',
          animation: 'orbDrift 24s ease infinite alternate',
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: '45vw',
          height: '45vw',
          bottom: '-14vw',
          right: '-12vw',
          background: 'var(--c3)',
          filter: 'blur(90px)',
          opacity: 0.55,
          zIndex: 0,
          willChange: 'transform',
          animation: 'orbDrift2 30s ease infinite alternate',
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: '30vw',
          height: '30vw',
          top: '30vh',
          right: '20vw',
          background: 'var(--c1)',
          filter: 'blur(90px)',
          opacity: 0.35,
          zIndex: 0,
          willChange: 'transform',
          animation: 'orbDrift 36s ease-in-out infinite alternate-reverse',
        }}
      />
    </>
  )
}
