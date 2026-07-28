import { useMemo, useState } from 'react'

import { GameScreen } from './components/GameScreen'
import { estimateStableLevel, proposedStartLevel } from './game/difficulty'
import { toggleFullscreen } from './services/fullscreenService'
import {
  DEFAULT_SETTINGS,
  clearPlayerData,
  exportPlayerData,
  loadPlayerData,
  loadSettings,
  saveSession,
  saveSettings,
} from './services/storageService'
import type { GameSession, PlayerData, Settings, TrainingOptions } from './types/storage'

type Screen = 'home' | 'start' | 'game' | 'training' | 'results' | 'settings' | 'summary'

const DEFAULT_TRAINING: TrainingOptions = {
  startLevel: 5,
  minLevel: 1,
  maxLevel: 20,
  contentType: 'mixed',
  trialCount: 20,
  speed: 'normal',
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettingsState] = useState<Settings>(loadSettings)
  const [player, setPlayer] = useState<PlayerData>(loadPlayerData)
  const [startLevel, setStartLevel] = useState(1)
  const [training, setTraining] = useState<TrainingOptions>(DEFAULT_TRAINING)
  const [lastSession, setLastSession] = useState<GameSession | null>(null)
  const [gameMode, setGameMode] = useState<'game' | 'training'>('game')

  const allTrials = useMemo(() => player.sessions.flatMap((session) => session.trials), [player])
  const stableLevel = estimateStableLevel(allTrials)
  const records = useMemo(
    () => ({
      score: Math.max(
        0,
        ...player.sessions.filter((item) => item.mode === 'game').map((item) => item.score),
      ),
      level: Math.max(1, ...player.sessions.map((item) => item.maxLevel)),
      streak: Math.max(0, ...player.sessions.map((item) => item.bestStreak)),
      successRate:
        player.sessions.length === 0
          ? 0
          : Math.round(
              (player.sessions.reduce((sum, item) => sum + item.successes, 0) /
                player.sessions.reduce((sum, item) => sum + item.successes + item.failures, 0)) *
                100,
            ),
    }),
    [player.sessions],
  )

  const updateSettings = (next: Settings) => {
    setSettingsState(next)
    saveSettings(next)
  }

  const beginMainGame = (level: number) => {
    setStartLevel(level)
    setGameMode('game')
    setScreen('game')
  }

  const finishGame = (session: GameSession) => {
    setLastSession(session)
    if (session.mode === 'game') setPlayer(saveSession(session))
    setScreen('summary')
  }

  if (screen === 'game') {
    return (
      <GameScreen
        mode={gameMode}
        startLevel={gameMode === 'game' ? startLevel : training.startLevel}
        totalTrials={gameMode === 'game' ? settings.trialCount : training.trialCount}
        speed={gameMode === 'game' ? settings.speed : training.speed}
        settings={settings}
        contentType={gameMode === 'training' ? training.contentType : 'mixed'}
        minLevel={gameMode === 'training' ? training.minLevel : 1}
        maxLevel={gameMode === 'training' ? training.maxLevel : 60}
        onFinish={finishGame}
        onQuit={() => setScreen('home')}
      />
    )
  }

  if (screen === 'start') {
    return (
      <Page title="Choisis ton départ" onBack={() => setScreen('home')}>
        {player.sessions.length === 0 ? (
          <button className="primary-button" onClick={() => beginMainGame(1)}>
            Commencer au niveau 1
          </button>
        ) : (
          <div className="button-stack">
            <p className="lead">
              Niveau stable estimé : <strong>{stableLevel}</strong>
            </p>
            <button
              className="primary-button"
              onClick={() =>
                beginMainGame(settings.adaptiveStart ? proposedStartLevel(stableLevel) : 1)
              }
            >
              Continuer au niveau {settings.adaptiveStart ? proposedStartLevel(stableLevel) : 1}
            </button>
            <button className="secondary-button" onClick={() => beginMainGame(1)}>
              Repartir du niveau 1
            </button>
          </div>
        )}
      </Page>
    )
  }

  if (screen === 'training') {
    return (
      <Page title="Entraînement" onBack={() => setScreen('home')}>
        <div className="settings-grid">
          <NumberField
            label="Niveau de départ"
            value={training.startLevel}
            min={training.minLevel}
            max={training.maxLevel}
            onChange={(startLevel) => setTraining({ ...training, startLevel })}
          />
          <NumberField
            label="Niveau minimum"
            value={training.minLevel}
            min={1}
            max={training.maxLevel}
            onChange={(minLevel) =>
              setTraining({
                ...training,
                minLevel,
                startLevel: Math.max(minLevel, training.startLevel),
              })
            }
          />
          <NumberField
            label="Niveau maximum"
            value={training.maxLevel}
            min={training.minLevel}
            max={60}
            onChange={(maxLevel) =>
              setTraining({
                ...training,
                maxLevel,
                startLevel: Math.min(maxLevel, training.startLevel),
              })
            }
          />
          <SelectField
            label="Contenu"
            value={training.contentType}
            options={[
              ['mixed', 'Mélange adapté'],
              ['letter', 'Lettres'],
              ['syllable', 'Syllabes'],
              ['word', 'Mots'],
              ['group', 'Groupes de mots'],
              ['sentence', 'Phrases'],
            ]}
            onChange={(contentType) =>
              setTraining({
                ...training,
                contentType: contentType as TrainingOptions['contentType'],
              })
            }
          />
          <SelectField
            label="Durée"
            value={String(training.trialCount)}
            options={[
              ['10', '10 essais'],
              ['20', '20 essais'],
              ['30', '30 essais'],
            ]}
            onChange={(value) =>
              setTraining({ ...training, trialCount: Number(value) as 10 | 20 | 30 })
            }
          />
          <SelectField
            label="Vitesse"
            value={training.speed}
            options={[
              ['slow', 'Lente'],
              ['normal', 'Normale'],
              ['fast', 'Rapide'],
            ]}
            onChange={(speed) =>
              setTraining({ ...training, speed: speed as TrainingOptions['speed'] })
            }
          />
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setGameMode('training')
            setScreen('game')
          }}
        >
          Lancer l’entraînement
        </button>
      </Page>
    )
  }

  if (screen === 'settings') {
    return (
      <Page title="Réglages" onBack={() => setScreen('home')}>
        <div className="settings-grid">
          <SelectField
            label="Durée d’une partie"
            value={String(settings.trialCount)}
            options={[
              ['10', '10 essais'],
              ['20', '20 essais'],
              ['30', '30 essais'],
            ]}
            onChange={(value) =>
              updateSettings({ ...settings, trialCount: Number(value) as 10 | 20 | 30 })
            }
          />
          <SelectField
            label="Vitesse"
            value={settings.speed}
            options={[
              ['slow', 'Lente'],
              ['normal', 'Normale'],
              ['fast', 'Rapide'],
            ]}
            onChange={(speed) => updateSettings({ ...settings, speed: speed as Settings['speed'] })}
          />
          <Toggle
            label="Démarrage adaptatif"
            checked={settings.adaptiveStart}
            onChange={(adaptiveStart) => updateSettings({ ...settings, adaptiveStart })}
          />
          <Toggle
            label="Afficher les syllabes"
            checked={settings.includeSyllables}
            onChange={(includeSyllables) => updateSettings({ ...settings, includeSyllables })}
          />
          <Toggle
            label="Texte agrandi"
            checked={settings.largeText}
            onChange={(largeText) => updateSettings({ ...settings, largeText })}
          />
          <Toggle
            label="Animations réduites"
            checked={settings.reducedMotion}
            onChange={(reducedMotion) => updateSettings({ ...settings, reducedMotion })}
          />
          <Toggle
            label="Contraste élevé"
            checked={settings.highContrast}
            onChange={(highContrast) => updateSettings({ ...settings, highContrast })}
          />
          <Toggle
            label="Effets sonores"
            checked={settings.soundEnabled}
            onChange={(soundEnabled) => updateSettings({ ...settings, soundEnabled })}
          />
          <Toggle
            label="Voix"
            checked={settings.speechEnabled}
            onChange={(speechEnabled) => updateSettings({ ...settings, speechEnabled })}
          />
          <label className="field">
            <span>Volume : {Math.round(settings.volume * 100)} %</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(event) =>
                updateSettings({ ...settings, volume: Number(event.target.value) })
              }
            />
          </label>
        </div>
        <div className="button-row">
          <button className="secondary-button" onClick={() => updateSettings(DEFAULT_SETTINGS)}>
            Réglages par défaut
          </button>
          <button className="secondary-button" onClick={() => void toggleFullscreen()}>
            Plein écran
          </button>
        </div>
      </Page>
    )
  }

  if (screen === 'results') {
    const missed = [...player.missed]
      .sort((a, b) => b.errors / b.presentations - a.errors / a.presentations)
      .slice(0, 5)
    return (
      <Page title="Résultats" onBack={() => setScreen('home')}>
        <div className="stats-grid">
          <Stat label="Parties" value={player.sessions.length} />
          <Stat label="Meilleur score" value={records.score} />
          <Stat label="Niveau maximal" value={records.level} />
          <Stat label="Niveau stable" value={stableLevel} />
          <Stat label="Réussite moyenne" value={`${records.successRate} %`} />
          <Stat label="Meilleure série" value={records.streak} />
        </div>
        <ProgressChart sessions={player.sessions} />
        <section className="missed-list">
          <h2>À revoir</h2>
          {missed.length === 0 ? (
            <p>Aucun stimulus difficile pour le moment.</p>
          ) : (
            <ul>
              {missed.map((item) => (
                <li key={item.id}>
                  {item.id} — {item.errors} erreur(s)
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="button-row">
          <button className="secondary-button" onClick={exportPlayerData}>
            Exporter les résultats
          </button>
          <button
            className="danger-button"
            onClick={() => {
              if (window.confirm('Effacer tous les résultats ?')) {
                clearPlayerData()
                setPlayer({ sessions: [], missed: [] })
              }
            }}
          >
            Effacer les résultats
          </button>
        </div>
      </Page>
    )
  }

  if (screen === 'summary' && lastSession) {
    const attempts = lastSession.successes + lastSession.failures
    const previousBest = Math.max(0, ...player.sessions.slice(0, -1).map((item) => item.score))
    return (
      <Page title="Partie terminée" onBack={() => setScreen('home')}>
        <div className="stats-grid">
          <Stat label="Score total" value={lastSession.score} />
          <Stat label="Niveau maximal" value={lastSession.maxLevel} />
          <Stat label="Niveau final" value={lastSession.finalLevel} />
          <Stat
            label="Taux de réussite"
            value={`${Math.round((lastSession.successes / Math.max(1, attempts)) * 100)} %`}
          />
          <Stat label="Meilleure série" value={lastSession.bestStreak} />
          <Stat
            label="Temps moyen"
            value={`${(lastSession.averageResponseTimeMs / 1000).toFixed(1)} s`}
          />
        </div>
        {lastSession.mode === 'game' && lastSession.score > previousBest && (
          <p className="record-banner">Nouveau record !</p>
        )}
        <div className="button-row">
          <button className="primary-button" onClick={() => beginMainGame(lastSession.startLevel)}>
            Rejouer
          </button>
          <button className="secondary-button" onClick={() => setScreen('home')}>
            Accueil
          </button>
        </div>
      </Page>
    )
  }

  return (
    <main
      className={`app-shell ${settings.largeText ? 'large-text' : ''} ${settings.highContrast ? 'high-contrast' : ''} ${settings.reducedMotion ? 'reduce-motion' : ''}`}
    >
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">Reconnaissance visuelle</p>
        <h1 id="app-title">FlashWords</h1>
        <p className="tagline">Observe. Mémorise. Écris.</p>
        <div className="home-actions">
          <button className="primary-button" onClick={() => setScreen('start')}>
            Jouer
          </button>
          <button className="secondary-button" onClick={() => setScreen('training')}>
            Entraînement
          </button>
          <button className="secondary-button" onClick={() => setScreen('results')}>
            Résultats
          </button>
          <button className="secondary-button" onClick={() => setScreen('settings')}>
            Réglages
          </button>
        </div>
        <div className="home-stats">
          <span>
            Record <strong>{records.score}</strong>
          </span>
          <span>
            Niveau stable <strong>{stableLevel}</strong>
          </span>
        </div>
        <button className="text-button" onClick={() => void toggleFullscreen()}>
          Passer en plein écran
        </button>
      </section>
    </main>
  )
}

function Page({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <main className="page-shell">
      <header className="page-header">
        <button className="back-button" onClick={onBack}>
          ← Retour
        </button>
        <h1 className="screen-title">{title}</h1>
      </header>
      <section className="page-content">{children}</section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: [string, string][]
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value))))}
      />
    </label>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

function ProgressChart({ sessions }: { sessions: GameSession[] }) {
  const recent = sessions.slice(-10)
  if (recent.length < 2) return null
  const width = 500
  const height = 120
  const max = Math.max(...recent.map((item) => item.maxLevel), 1)
  const points = recent
    .map(
      (item, index) =>
        `${(index / (recent.length - 1)) * width},${height - (item.maxLevel / max) * (height - 12)}`,
    )
    .join(' ')
  return (
    <section className="chart-card">
      <h2>Progression récente</h2>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Courbe des niveaux maximaux récents"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </section>
  )
}
