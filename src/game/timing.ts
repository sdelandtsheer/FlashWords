import { GAME_CONFIG, SPEED_MULTIPLIERS, type Speed } from './config'

export function getExposureDuration(letterCount: number, speed: Speed = 'normal'): number {
  const normalDuration =
    GAME_CONFIG.baseExposureMs +
    GAME_CONFIG.exposurePerExtraLetterMs * (Math.max(1, letterCount) - 1)
  const adjusted = normalDuration * SPEED_MULTIPLIERS[speed]
  return Math.round(
    Math.min(GAME_CONFIG.maxExposureMs, Math.max(GAME_CONFIG.minExposureMs, adjusted)),
  )
}
