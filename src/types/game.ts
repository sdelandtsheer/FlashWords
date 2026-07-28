export type StimulusType = 'letter' | 'syllable' | 'word' | 'group' | 'sentence'
export type GameMode = 'game' | 'training'
export type GamePhase =
  | 'fixation'
  | 'stimulus'
  | 'blank'
  | 'input'
  | 'success'
  | 'failure'
  | 'transition'
  | 'paused'
  | 'finished'

export interface Stimulus {
  id: string
  text: string
  type: StimulusType
  letterCount: number
  difficulty: number
  themes: string[]
  enabled: boolean
}

export interface TrialResult {
  stimulusId: string
  level: number
  correct: boolean
  responseTimeMs: number
}

export interface GameState {
  mode: GameMode
  phase: GamePhase
  level: number
  startLevel: number
  maxLevel: number
  trialIndex: number
  totalTrials: number
  score: number
  streak: number
  bestStreak: number
  maxLevelReached: number
  currentStimulus: Stimulus | null
  answer: string
  results: TrialResult[]
  inputStartedAt: number | null
  phaseBeforePause: Exclude<GamePhase, 'paused'> | null
}
