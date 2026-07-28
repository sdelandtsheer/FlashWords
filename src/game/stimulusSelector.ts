import { GAME_CONFIG } from './config'
import type { Stimulus } from '../types/game'

export interface SelectionContext {
  recentIds: string[]
  usedIds: string[]
  missedIds: string[]
  random?: () => number
}

export function selectStimulus(
  corpus: Stimulus[],
  level: number,
  context: SelectionContext,
): Stimulus | null {
  const candidates = corpus.filter((stimulus) => stimulus.enabled && stimulus.letterCount === level)
  if (candidates.length === 0) return null

  const recent = new Set(context.recentIds.slice(-GAME_CONFIG.recentStimuliLimit))
  const unused = candidates.filter(
    (stimulus) => !context.usedIds.includes(stimulus.id) && !recent.has(stimulus.id),
  )
  const delayedMisses = candidates.filter(
    (stimulus) => context.missedIds.includes(stimulus.id) && !recent.has(stimulus.id),
  )
  const nonRecent = candidates.filter((stimulus) => !recent.has(stimulus.id))

  const pool =
    delayedMisses.length > 0
      ? [...unused, ...delayedMisses.filter((item) => !unused.includes(item))]
      : unused.length > 0
        ? unused
        : nonRecent.length > 0
          ? nonRecent
          : candidates
  const random = context.random ?? Math.random
  return pool[Math.floor(random() * pool.length)] ?? pool[0] ?? null
}
