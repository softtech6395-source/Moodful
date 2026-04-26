import { useCallback, useRef, useState } from 'react'

export function useToast(durationMs = 2200) {
  const [message, setMessage] = useState<string | null>(null)
  const tRef = useRef<number | null>(null)

  const show = useCallback(
    (msg: string) => {
      setMessage(msg)
      if (tRef.current) window.clearTimeout(tRef.current)
      tRef.current = window.setTimeout(() => setMessage(null), durationMs)
    },
    [durationMs],
  )

  return { message, show }
}
