import { estimateStableLevel, nextLevel, proposedStartLevel } from '../src/game/difficulty'
import { createGameState, gameReducer } from '../src/game/gameState'
import { pointsForSuccess, streakBonus } from '../src/game/scoring'
import { getExposureDuration } from '../src/game/timing'
import type { Stimulus, TrialResult } from '../src/types/game'

const stimulus: Stimulus = {
  id: 'word_chat',
  text: 'chat',
  type: 'word',
  letterCount: 4,
  difficulty: 4,
  themes: ['animaux'],
  enabled: true,
}

describe('progression', () => {
  it.each([
    [1, false, 1],
    [1, true, 2],
    [5, false, 4],
    [5, true, 6],
    [60, true, 60],
  ])('fait évoluer le niveau %i', (level, correct, expected) => {
    expect(nextLevel(level, correct)).toBe(expected)
  })

  it('propose un départ trois niveaux sous le niveau stable', () => {
    expect(proposedStartLevel(14)).toBe(11)
    expect(proposedStartLevel(2)).toBe(1)
  })

  it('estime le plus haut niveau récent réussi à au moins 70 %', () => {
    const results: TrialResult[] = [
      ...Array.from({ length: 10 }, (_, index) => ({
        stimulusId: `a-${index}`,
        level: 8,
        correct: index < 8,
        responseTimeMs: 1000,
      })),
      ...Array.from({ length: 10 }, (_, index) => ({
        stimulusId: `b-${index}`,
        level: 9,
        correct: index < 6,
        responseTimeMs: 1000,
      })),
    ]
    expect(estimateStableLevel(results)).toBe(8)
  })
})

describe('score et durée', () => {
  it('applique le score de base et les bonus de série', () => {
    expect(pointsForSuccess(8, 1)).toBe(180)
    expect(streakBonus(3)).toBe(50)
    expect(streakBonus(6)).toBe(125)
  })

  it('calcule et borne les durées selon la vitesse', () => {
    expect(getExposureDuration(1)).toBe(500)
    expect(getExposureDuration(5)).toBe(600)
    expect(getExposureDuration(5, 'slow')).toBe(750)
    expect(getExposureDuration(100, 'fast')).toBe(1800)
  })
})

describe('gameReducer', () => {
  it('ignore une réponse vide et empêche une double validation', () => {
    let state = createGameState(4)
    state = gameReducer(state, { type: 'SET_STIMULUS', stimulus })
    state = gameReducer(state, { type: 'SET_PHASE', phase: 'input', now: 100 })
    expect(gameReducer(state, { type: 'SUBMIT', correct: true, now: 200 })).toBe(state)

    state = gameReducer(state, { type: 'SET_ANSWER', answer: 'chat' })
    const submitted = gameReducer(state, { type: 'SUBMIT', correct: true, now: 300 })
    expect(submitted.score).toBe(140)
    expect(submitted.level).toBe(5)
    expect(gameReducer(submitted, { type: 'SUBMIT', correct: true, now: 400 })).toBe(submitted)
  })

  it('termine après le dernier essai', () => {
    const state = { ...createGameState(1, 1), phase: 'success' as const }
    expect(gameReducer(state, { type: 'NEXT_TRIAL' }).phase).toBe('finished')
  })

  it("annule l'essai affiché lors d'une perte de focus", () => {
    const state = { ...createGameState(), phase: 'stimulus' as const, currentStimulus: stimulus }
    const paused = gameReducer(state, { type: 'PAUSE', cancelTrial: true })
    expect(paused.phase).toBe('paused')
    expect(paused.currentStimulus).toBeNull()
    expect(gameReducer(paused, { type: 'RESUME' }).phase).toBe('fixation')
  })
})
