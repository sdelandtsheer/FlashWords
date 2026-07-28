import { GAME_CONFIG } from './config'
import { nextLevel } from './difficulty'
import { pointsForSuccess } from './scoring'
import type { GameMode, GamePhase, GameState, Stimulus } from '../types/game'

export type GameAction =
  | { type: 'SET_PHASE'; phase: GamePhase; now?: number }
  | { type: 'SET_LEVEL'; level: number }
  | { type: 'SET_STIMULUS'; stimulus: Stimulus }
  | { type: 'SET_ANSWER'; answer: string }
  | { type: 'SUBMIT'; correct: boolean; now: number }
  | { type: 'NEXT_TRIAL' }
  | { type: 'PAUSE'; cancelTrial?: boolean }
  | { type: 'RESUME' }
  | { type: 'RESTART' }

export function createGameState(
  startLevel = 1,
  totalTrials: number = GAME_CONFIG.defaultTrials,
  mode: GameMode = 'game',
): GameState {
  return {
    mode,
    phase: 'fixation',
    level: startLevel,
    startLevel,
    maxLevel: GAME_CONFIG.maxLevel,
    trialIndex: 0,
    totalTrials,
    score: 0,
    streak: 0,
    bestStreak: 0,
    maxLevelReached: startLevel,
    currentStimulus: null,
    answer: '',
    results: [],
    inputStartedAt: null,
    phaseBeforePause: null,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PHASE':
      return {
        ...state,
        phase: action.phase,
        inputStartedAt:
          action.phase === 'input' ? (action.now ?? Date.now()) : state.inputStartedAt,
      }
    case 'SET_LEVEL':
      return {
        ...state,
        level: action.level,
        maxLevelReached: Math.max(state.maxLevelReached, action.level),
      }
    case 'SET_STIMULUS':
      return { ...state, currentStimulus: action.stimulus, answer: '' }
    case 'SET_ANSWER':
      return state.phase === 'input' ? { ...state, answer: action.answer } : state
    case 'SUBMIT': {
      if (state.phase !== 'input' || !state.currentStimulus || state.answer.trim() === '')
        return state
      const newStreak = action.correct ? state.streak + 1 : 0
      const result = {
        stimulusId: state.currentStimulus.id,
        level: state.level,
        correct: action.correct,
        responseTimeMs: Math.max(0, action.now - (state.inputStartedAt ?? action.now)),
      }
      return {
        ...state,
        phase: action.correct ? 'success' : 'failure',
        score: state.score + (action.correct ? pointsForSuccess(state.level, newStreak) : 0),
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        level: nextLevel(state.level, action.correct, state.maxLevel),
        maxLevelReached: Math.max(state.maxLevelReached, state.level),
        results: [...state.results, result],
      }
    }
    case 'NEXT_TRIAL': {
      const nextIndex = state.trialIndex + 1
      return {
        ...state,
        trialIndex: nextIndex,
        phase: nextIndex >= state.totalTrials ? 'finished' : 'fixation',
        currentStimulus: null,
        answer: '',
        inputStartedAt: null,
      }
    }
    case 'PAUSE':
      if (state.phase === 'paused' || state.phase === 'finished') return state
      return {
        ...state,
        phase: 'paused',
        phaseBeforePause: action.cancelTrial ? 'fixation' : state.phase,
        currentStimulus: action.cancelTrial ? null : state.currentStimulus,
      }
    case 'RESUME':
      return state.phase === 'paused'
        ? { ...state, phase: state.phaseBeforePause ?? 'fixation', phaseBeforePause: null }
        : state
    case 'RESTART':
      return createGameState(state.startLevel, state.totalTrials, state.mode)
  }
}
