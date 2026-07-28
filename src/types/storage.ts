import type { GameMode, StimulusType, TrialResult } from './game'
import type { Speed } from '../game/config'

export interface Settings {
  trialCount: 10 | 20 | 30
  speed: Speed
  adaptiveStart: boolean
  includeSyllables: boolean
  largeText: boolean
  reducedMotion: boolean
  highContrast: boolean
  soundEnabled: boolean
  speechEnabled: boolean
  volume: number
}

export interface GameSession {
  id: string
  date: string
  mode: GameMode
  startLevel: number
  maxLevel: number
  finalLevel: number
  score: number
  successes: number
  failures: number
  bestStreak: number
  averageResponseTimeMs: number
  trials: TrialResult[]
}

export interface MissedStimulus {
  id: string
  presentations: number
  errors: number
}

export interface PlayerData {
  sessions: GameSession[]
  missed: MissedStimulus[]
}

export interface TrainingOptions {
  startLevel: number
  minLevel: number
  maxLevel: number
  contentType: StimulusType | 'mixed'
  trialCount: 10 | 20 | 30
  speed: Speed
}
