export type MoodKey = 'happy' | 'sad' | 'stressed' | 'calm' | 'motivated'

export type ParticleConfig =
  | { type: 'bubbles'; speed: number; count: number; size: [number, number]; color: string }
  | { type: 'rain'; speed: number; count: number; size: [number, number]; color: string }
  | { type: 'breathe'; speed: number; count: number; size: [number, number]; color: string }
  | { type: 'drift'; speed: number; count: number; size: [number, number]; color: string }
  | { type: 'streaks'; speed: number; count: number; size: [number, number]; color: string }

export interface AudioConfig {
  freqs: number[]
  gain: number
  lfo: number
  type: OscillatorType
}

export interface Mood {
  label: string
  emoji: string
  palette: [string, string, string]
  quote: string
  sub: string
  font: string
  weight: number
  accent: string
  fg: string
  fgMuted: string
  tempo: string
  particles: ParticleConfig
  audio: AudioConfig
}

export const MOODS: Record<MoodKey, Mood> = {
  happy: {
    label: 'Happy',
    emoji: '☀️',
    palette: ['#FFE29F', '#FFA751', '#FF8966'],
    quote: 'Joy is the simplest form of gratitude.',
    sub: 'Carry this lightness with you, even into the shaded hours.',
    font: "'Plus Jakarta Sans', sans-serif",
    weight: 700,
    accent: '#FFE29F',
    fg: '#3a1f0a',
    fgMuted: 'rgba(58,31,10,0.6)',
    tempo: 'lively · 96 bpm',
    particles: { type: 'bubbles', speed: 0.7, count: 70, size: [4, 14], color: '#FFE29F' },
    audio: { freqs: [392, 523.25, 659.25], gain: 0.06, lfo: 0.35, type: 'sine' },
  },
  sad: {
    label: 'Sad',
    emoji: '🌧',
    palette: ['#1E3A5F', '#0F1A2E', '#3A5A8F'],
    quote: 'Even the heaviest clouds release their weight as rain.',
    sub: 'Sit with it. Softness is its own kind of strength.',
    font: "'Cormorant Garamond', serif",
    weight: 500,
    accent: '#A4C2E8',
    fg: '#eef3fa',
    fgMuted: 'rgba(238,243,250,0.6)',
    tempo: 'slow · 56 bpm',
    particles: { type: 'rain', speed: 1.4, count: 220, size: [1, 2], color: '#A4C2E8' },
    audio: { freqs: [196, 233.08, 293.66], gain: 0.05, lfo: 0.15, type: 'sine' },
  },
  stressed: {
    label: 'Stressed',
    emoji: '🌊',
    palette: ['#3D1A4A', '#7A3B7C', '#E07A5F'],
    quote: 'Breathe in for four. Hold seven. Out for eight.',
    sub: "You aren't behind. You are exactly where you are.",
    font: "'Inter', sans-serif",
    weight: 800,
    accent: '#F4C4A1',
    fg: '#fbeee4',
    fgMuted: 'rgba(251,238,228,0.6)',
    tempo: 'pulse · 60 bpm',
    particles: { type: 'breathe', speed: 0.5, count: 1, size: [180, 260], color: '#F4C4A1' },
    audio: { freqs: [174.61, 261.63, 329.63], gain: 0.045, lfo: 0.18, type: 'sine' },
  },
  calm: {
    label: 'Calm',
    emoji: '🌿',
    palette: ['#88D8C0', '#A8E6CF', '#7FCDCD'],
    quote: 'Stillness is not absence. It is presence without noise.',
    sub: "Let the world keep moving. You don't have to keep up.",
    font: "'Fraunces', serif",
    weight: 300,
    accent: '#E8F8F1',
    fg: '#0e2c25',
    fgMuted: 'rgba(14,44,37,0.6)',
    tempo: 'breathing · 48 bpm',
    particles: { type: 'drift', speed: 0.35, count: 50, size: [22, 64], color: '#E8F8F1' },
    audio: { freqs: [220, 329.63, 432], gain: 0.05, lfo: 0.1, type: 'sine' },
  },
  motivated: {
    label: 'Motivated',
    emoji: '⚡',
    palette: ['#3A0CA3', '#7209B7', '#F72585'],
    quote: 'Discipline outlives motivation. Show up anyway.',
    sub: 'The next ten minutes are yours. Take them.',
    font: "'Space Grotesk', sans-serif",
    weight: 700,
    accent: '#F72585',
    fg: '#ffffff',
    fgMuted: 'rgba(255,255,255,0.65)',
    tempo: 'sharp · 124 bpm',
    particles: { type: 'streaks', speed: 3, count: 55, size: [1.5, 3.5], color: '#F72585' },
    audio: { freqs: [261.63, 392, 587.33], gain: 0.05, lfo: 0.5, type: 'triangle' },
  },
}

export const MOOD_KEYS = Object.keys(MOODS) as MoodKey[]

export const REACTIONS = [
  { id: 'love', emoji: '❤️', label: 'appreciate' },
  { id: 'relate', emoji: '🤝', label: 'relate' },
  { id: 'sorry', emoji: '🌧', label: 'sorry' },
  { id: 'fire', emoji: '🔥', label: 'motivation' },
] as const

export type ReactionId = (typeof REACTIONS)[number]['id']
