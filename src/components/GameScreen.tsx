import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { corpus as fullCorpus } from '../data/corpus'
import { GAME_CONFIG, type Speed } from '../game/config'
import { createGameState, gameReducer } from '../game/gameState'
import { answersMatch } from '../game/normalization'
import { selectStimulus } from '../game/stimulusSelector'
import { getExposureDuration } from '../game/timing'
import { playFailure, playSuccess } from '../services/audioService'
import { cancelSpeech, announceFailure } from '../services/speechService'
import { toggleFullscreen } from '../services/fullscreenService'
import type { GameMode, StimulusType } from '../types/game'
import type { GameSession, Settings } from '../types/storage'

interface GameScreenProps {
  mode: GameMode
  startLevel: number
  totalTrials: number
  speed: Speed
  settings: Settings
  contentType?: StimulusType | 'mixed'
  minLevel?: number
  maxLevel?: number
  onFinish: (session: GameSession) => void
  onQuit: () => void
}

export function GameScreen({
  mode,
  startLevel,
  totalTrials,
  speed,
  settings,
  contentType = 'mixed',
  minLevel = 1,
  maxLevel = 60,
  onFinish,
  onQuit,
}: GameScreenProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createGameState(startLevel, totalTrials, mode),
  )
  const [muted, setMuted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const finishSent = useRef(false)
  const recentIdsRef = useRef<string[]>([])
  const usedIdsRef = useRef<string[]>([])

  const availableCorpus = useMemo(
    () =>
      fullCorpus.filter(
        (item) =>
          item.letterCount >= minLevel &&
          item.letterCount <= maxLevel &&
          (contentType === 'mixed' || item.type === contentType) &&
          (settings.includeSyllables || item.type !== 'syllable'),
      ),
    [contentType, maxLevel, minLevel, settings.includeSyllables],
  )
  const missedIds = useMemo(
    () => state.results.filter((result) => !result.correct).map((result) => result.stimulusId),
    [state.results],
  )

  const chooseStimulus = useCallback(() => {
    const requestedLevel = Math.min(maxLevel, Math.max(minLevel, state.level))
    const levels = [...new Set(availableCorpus.map((item) => item.letterCount))]
    const selectionLevel = levels.includes(requestedLevel)
      ? requestedLevel
      : (levels.sort((a, b) => Math.abs(a - requestedLevel) - Math.abs(b - requestedLevel))[0] ??
        requestedLevel)
    const stimulus = selectStimulus(availableCorpus, selectionLevel, {
      recentIds: recentIdsRef.current,
      usedIds: usedIdsRef.current,
      missedIds,
    })
    if (stimulus) {
      if (selectionLevel !== state.level) dispatch({ type: 'SET_LEVEL', level: selectionLevel })
      dispatch({ type: 'SET_STIMULUS', stimulus })
      recentIdsRef.current = [...recentIdsRef.current, stimulus.id].slice(-10)
      usedIdsRef.current = [...usedIdsRef.current, stimulus.id]
    }
  }, [availableCorpus, maxLevel, minLevel, missedIds, state.level])

  useEffect(() => {
    if (state.phase !== 'fixation') return
    const selectionTimer = window.setTimeout(chooseStimulus, 0)
    const timer = window.setTimeout(
      () => dispatch({ type: 'SET_PHASE', phase: 'stimulus' }),
      GAME_CONFIG.fixationMs,
    )
    return () => {
      clearTimeout(selectionTimer)
      clearTimeout(timer)
    }
  }, [chooseStimulus, state.phase, state.trialIndex])

  useEffect(() => {
    if (state.phase !== 'stimulus' || !state.currentStimulus) return
    const timer = window.setTimeout(
      () => dispatch({ type: 'SET_PHASE', phase: 'blank' }),
      getExposureDuration(state.currentStimulus.letterCount, speed),
    )
    return () => clearTimeout(timer)
  }, [speed, state.currentStimulus, state.phase])

  useEffect(() => {
    if (state.phase !== 'blank') return
    const timer = window.setTimeout(
      () => dispatch({ type: 'SET_PHASE', phase: 'input', now: performance.now() }),
      GAME_CONFIG.blankMs,
    )
    return () => clearTimeout(timer)
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'input') inputRef.current?.focus()
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'success' && state.phase !== 'failure') return
    if (!muted && settings.soundEnabled) {
      if (state.phase === 'success') playSuccess(settings.volume)
      else playFailure(settings.volume)
    }
    let cancelled = false
    const continueTrial = async () => {
      if (state.phase === 'failure' && settings.speechEnabled && !muted) {
        await announceFailure(state.level, settings.volume)
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, GAME_CONFIG.feedbackMs))
      }
      if (!cancelled) dispatch({ type: 'NEXT_TRIAL' })
    }
    void continueTrial()
    return () => {
      cancelled = true
      cancelSpeech()
    }
  }, [
    muted,
    settings.soundEnabled,
    settings.speechEnabled,
    settings.volume,
    state.currentStimulus,
    state.level,
    state.phase,
  ])

  useEffect(() => {
    if (state.phase !== 'finished' || finishSent.current) return
    finishSent.current = true
    const successes = state.results.filter((result) => result.correct).length
    const average =
      state.results.length > 0
        ? Math.round(
            state.results.reduce((sum, result) => sum + result.responseTimeMs, 0) /
              state.results.length,
          )
        : 0
    onFinish({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mode,
      startLevel,
      maxLevel: state.maxLevelReached,
      finalLevel: state.level,
      score: state.score,
      successes,
      failures: state.results.length - successes,
      bestStreak: state.bestStreak,
      averageResponseTimeMs: average,
      trials: state.results,
    })
  }, [mode, onFinish, startLevel, state])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state.phase === 'stimulus') {
        dispatch({ type: 'PAUSE', cancelTrial: true })
      }
    }
    const handleBlur = () => {
      if (state.phase === 'stimulus') dispatch({ type: 'PAUSE', cancelTrial: true })
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [state.phase])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.phase !== 'finished') {
        dispatch({ type: state.phase === 'paused' ? 'RESUME' : 'PAUSE' })
      } else if (event.key.toLowerCase() === 'm') {
        setMuted((value) => !value)
      } else if (event.key.toLowerCase() === 'f') {
        void toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [state.phase])

  const submit = () => {
    if (state.phase !== 'input' || !state.answer.trim() || !state.currentStimulus) return
    dispatch({
      type: 'SUBMIT',
      correct: answersMatch(state.answer, state.currentStimulus.text),
      now: performance.now(),
    })
  }

  if (state.phase === 'paused') {
    return (
      <main className="game-shell pause-screen">
        <p className="eyebrow">Partie en pause</p>
        <h1 className="screen-title">Pause</h1>
        <div className="button-stack">
          <button className="primary-button" onClick={() => dispatch({ type: 'RESUME' })}>
            Reprendre
          </button>
          <button className="secondary-button" onClick={() => dispatch({ type: 'RESTART' })}>
            Recommencer la partie
          </button>
          <button className="secondary-button" onClick={onQuit}>
            Quitter la partie
          </button>
          <button className="text-button" onClick={() => setMuted((value) => !value)}>
            {muted ? 'Réactiver le son' : 'Couper le son'}
          </button>
        </div>
      </main>
    )
  }

  const showStimulus = state.phase === 'stimulus'
  const showInput = state.phase === 'input'
  const showFeedback = state.phase === 'success' || state.phase === 'failure'

  return (
    <main
      className={`game-shell phase-${state.phase} ${settings.largeText ? 'large-text' : ''} ${settings.highContrast ? 'high-contrast' : ''} ${settings.reducedMotion ? 'reduce-motion' : ''}`}
    >
      <header className="game-hud" aria-label="Progression">
        <span>Niveau {state.level}</span>
        <span className="hud-score">{state.score} pts</span>
        <span>
          Essai {Math.min(state.trialIndex + 1, state.totalTrials)} / {state.totalTrials}
        </span>
      </header>
      <section className="trial-stage" aria-live="polite">
        {state.phase === 'fixation' && (
          <span className="fixation-dot" aria-label="Point de fixation" />
        )}
        {showStimulus && state.currentStimulus && (
          <p className="stimulus-text">{state.currentStimulus.text}</p>
        )}
        {showInput && (
          <form
            className="answer-form"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <label className="sr-only" htmlFor="answer">
              Ta réponse
            </label>
            <input
              id="answer"
              ref={inputRef}
              value={state.answer}
              onChange={(event) => dispatch({ type: 'SET_ANSWER', answer: event.target.value })}
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
            />
            <button className="primary-button validate-button" type="submit">
              Valider
            </button>
          </form>
        )}
        {showFeedback && state.currentStimulus && (
          <div className={`feedback-card ${state.phase}`}>
            <h2>{state.phase === 'success' ? 'Réussi !' : 'Presque !'}</h2>
            {state.phase === 'success' ? (
              <p className="feedback-stimulus">{state.currentStimulus.text}</p>
            ) : (
              <>
                <p>Ta réponse : {state.answer}</p>
                <p>Réponse attendue : {state.currentStimulus.text}</p>
              </>
            )}
            <strong>Niveau {state.level}</strong>
          </div>
        )}
      </section>
      {state.streak >= 3 && <p className="streak-toast">Série de {state.streak} !</p>}
      <button className="fullscreen-button" onClick={() => void toggleFullscreen()}>
        Plein écran
      </button>
    </main>
  )
}
