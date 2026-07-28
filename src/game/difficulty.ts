import { GAME_CONFIG } from './config'
import type { TrialResult } from '../types/game'

export function nextLevel(
  level: number,
  correct: boolean,
  maxLevel: number = GAME_CONFIG.maxLevel,
): number {
  const delta = correct ? 1 : -1
  return Math.min(maxLevel, Math.max(GAME_CONFIG.minLevel, level + delta))
}

export function proposedStartLevel(stableLevel: number): number {
  return Math.max(GAME_CONFIG.minLevel, stableLevel - 3)
}

export function estimateStableLevel(results: TrialResult[], recentLimit = 60): number {
  const recent = results.slice(-recentLimit)
  const perLevel = new Map<number, { successes: number; attempts: number }>()

  for (const result of recent) {
    const bucket = perLevel.get(result.level) ?? { successes: 0, attempts: 0 }
    bucket.attempts += 1
    bucket.successes += result.correct ? 1 : 0
    perLevel.set(result.level, bucket)
  }

  const stableLevels = [...perLevel.entries()]
    .filter(([, bucket]) => bucket.attempts >= 3 && bucket.successes / bucket.attempts >= 0.7)
    .map(([level]) => level)

  return stableLevels.length > 0 ? Math.max(...stableLevels) : GAME_CONFIG.minLevel
}
