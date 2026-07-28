export const GAME_CONFIG = {
  minLevel: 1,
  maxLevel: 60,
  defaultTrials: 20,
  fixationMs: 600,
  blankMs: 120,
  feedbackMs: 800,
  speechSafetyMs: 3500,
  recentStimuliLimit: 10,
  baseExposureMs: 500,
  exposurePerExtraLetterMs: 25,
  minExposureMs: 500,
  maxExposureMs: 1800,
} as const

export type Speed = 'slow' | 'normal' | 'fast'

export const SPEED_MULTIPLIERS: Record<Speed, number> = {
  slow: 1.25,
  normal: 1,
  fast: 0.8,
}
