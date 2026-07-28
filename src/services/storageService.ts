import type { GameSession, PlayerData, Settings } from '../types/storage'

const SETTINGS_KEY = 'flashwords:settings:v2'
const PLAYER_KEY = 'flashwords:player:v2'

export const DEFAULT_SETTINGS: Settings = {
  trialCount: 20,
  speed: 'normal',
  adaptiveStart: true,
  includeSyllables: true,
  largeText: false,
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true,
  speechEnabled: true,
  volume: 0.6,
}

const EMPTY_PLAYER: PlayerData = { sessions: [], missed: [] }

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadSettings(): Settings {
  const saved = readJson<Partial<Settings>>(SETTINGS_KEY, {})
  const trialCount = [10, 20, 30].includes(saved.trialCount ?? 0)
    ? (saved.trialCount as Settings['trialCount'])
    : DEFAULT_SETTINGS.trialCount
  const speed = ['slow', 'normal', 'fast'].includes(saved.speed ?? '')
    ? (saved.speed as Settings['speed'])
    : DEFAULT_SETTINGS.speed
  const volume =
    typeof saved.volume === 'number' && saved.volume >= 0 && saved.volume <= 1
      ? saved.volume
      : DEFAULT_SETTINGS.volume
  return { ...DEFAULT_SETTINGS, ...saved, trialCount, speed, volume }
}

export function saveSettings(settings: Settings): boolean {
  return writeJson(SETTINGS_KEY, settings)
}

export function loadPlayerData(): PlayerData {
  const saved = readJson<Partial<PlayerData>>(PLAYER_KEY, EMPTY_PLAYER)
  return {
    sessions: Array.isArray(saved.sessions) ? saved.sessions.slice(-100) : [],
    missed: Array.isArray(saved.missed) ? saved.missed : [],
  }
}

export function saveSession(session: GameSession): PlayerData {
  const data = loadPlayerData()
  const missedMap = new Map(data.missed.map((item) => [item.id, { ...item }]))
  for (const trial of session.trials) {
    const item = missedMap.get(trial.stimulusId) ?? {
      id: trial.stimulusId,
      presentations: 0,
      errors: 0,
    }
    item.presentations += 1
    item.errors += trial.correct ? 0 : 1
    missedMap.set(item.id, item)
  }
  const next = {
    sessions: [...data.sessions, session].slice(-100),
    missed: [...missedMap.values()],
  }
  writeJson(PLAYER_KEY, next)
  return next
}

export function clearPlayerData(): void {
  try {
    localStorage.removeItem(PLAYER_KEY)
  } catch {
    // Le stockage peut être désactivé : l'application continue en mémoire.
  }
}

export function exportPlayerData(): void {
  const blob = new Blob([JSON.stringify(loadPlayerData(), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `flashwords-resultats-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
