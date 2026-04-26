import { useEffect, useRef, useState, useCallback } from 'react'
import type { AudioConfig } from '../lib/moods'

interface Voice {
  osc: OscillatorNode
  gain: GainNode
}

export function useAudio(currentAudio: AudioConfig | null) {
  const [audioOn, setAudioOn] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const voicesRef = useRef<Voice[]>([])

  const initAudio = useCallback(() => {
    if (ctxRef.current) return
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = 0
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 0.7
    filter.connect(master).connect(ctx.destination)
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.25
    lfo.frequency.value = 0.18
    lfo.connect(lfoGain).connect(master.gain)
    lfo.start()
    ctxRef.current = ctx
    masterRef.current = master
    filterRef.current = filter
  }, [])

  const applyAudio = useCallback((cfg: AudioConfig) => {
    const ctx = ctxRef.current
    const filter = filterRef.current
    if (!ctx || !filter || !audioOn) return
    const t = ctx.currentTime
    voicesRef.current.forEach((v) => {
      v.gain.gain.cancelScheduledValues(t)
      v.gain.gain.linearRampToValueAtTime(0, t + 0.6)
      try { v.osc.stop(t + 0.7) } catch { /* already stopped */ }
    })
    voicesRef.current = []
    cfg.freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = i === 0 ? cfg.type : (cfg.type === 'sine' ? 'triangle' : 'sine')
      osc.frequency.value = f
      g.gain.value = 0
      g.gain.linearRampToValueAtTime(cfg.gain / cfg.freqs.length, t + 1.6)
      osc.connect(g).connect(filter)
      osc.start()
      voicesRef.current.push({ osc, gain: g })
    })
    filter.frequency.cancelScheduledValues(t)
    filter.frequency.linearRampToValueAtTime(600 + cfg.lfo * 2400, t + 1.6)
  }, [audioOn])

  // toggle handler
  const toggle = useCallback(() => {
    setAudioOn((prev) => {
      const next = !prev
      if (next) {
        initAudio()
        const ctx = ctxRef.current!
        const master = masterRef.current!
        if (ctx.state === 'suspended') ctx.resume()
        const t = ctx.currentTime
        master.gain.cancelScheduledValues(t)
        master.gain.linearRampToValueAtTime(1, t + 1.2)
      } else {
        const ctx = ctxRef.current
        const master = masterRef.current
        if (ctx && master) {
          const t = ctx.currentTime
          master.gain.cancelScheduledValues(t)
          master.gain.linearRampToValueAtTime(0, t + 0.6)
        }
      }
      return next
    })
  }, [initAudio])

  // when mood changes (and audio is on), apply new pad
  useEffect(() => {
    if (audioOn && currentAudio) applyAudio(currentAudio)
  }, [audioOn, currentAudio, applyAudio])

  // when toggling on with an existing mood, kick off the pad
  useEffect(() => {
    if (audioOn && currentAudio) applyAudio(currentAudio)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioOn])

  return { audioOn, toggle }
}
