import {
  DEFAULT_SETTINGS,
  loadPlayerData,
  loadSettings,
  saveSession,
  saveSettings,
} from '../src/services/storageService'

describe('storageService', () => {
  beforeEach(() => localStorage.clear())

  it('récupère des réglages par défaut face à des données invalides', () => {
    localStorage.setItem('flashwords:settings:v2', '{"trialCount":999,"volume":4}')
    expect(loadSettings().trialCount).toBe(20)
    expect(loadSettings().volume).toBe(DEFAULT_SETTINGS.volume)
  })

  it('sauvegarde les réglages', () => {
    expect(saveSettings({ ...DEFAULT_SETTINGS, speed: 'slow' })).toBe(true)
    expect(loadSettings().speed).toBe('slow')
  })

  it('conserve une partie et agrège les erreurs', () => {
    saveSession({
      id: 'session-1',
      date: '2026-01-01',
      mode: 'game',
      startLevel: 1,
      maxLevel: 2,
      finalLevel: 1,
      score: 110,
      successes: 1,
      failures: 1,
      bestStreak: 1,
      averageResponseTimeMs: 900,
      trials: [
        { stimulusId: 'a', level: 1, correct: true, responseTimeMs: 800 },
        { stimulusId: 'b', level: 2, correct: false, responseTimeMs: 1000 },
      ],
    })

    const data = loadPlayerData()
    expect(data.sessions).toHaveLength(1)
    expect(data.missed.find((item) => item.id === 'b')?.errors).toBe(1)
  })
})
