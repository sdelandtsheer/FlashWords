import { act, fireEvent, render, screen } from '@testing-library/react'

import { GameScreen } from '../src/components/GameScreen'
import { DEFAULT_SETTINGS } from '../src/services/storageService'

const props = {
  mode: 'game' as const,
  startLevel: 1,
  totalTrials: 1,
  speed: 'normal' as const,
  settings: { ...DEFAULT_SETTINGS, soundEnabled: false, speechEnabled: false },
  onFinish: vi.fn(),
  onQuit: vi.fn(),
}

async function reachInput() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500)
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(120)
  })
}

describe('GameScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    props.onFinish.mockClear()
  })

  afterEach(() => vi.useRealTimers())

  it('masque le champ pendant le stimulus puis lui donne le focus', async () => {
    render(<GameScreen {...props} />)
    await reachInput()

    const input = screen.getByRole('textbox')
    expect(input).toHaveFocus()
  })

  it('ignore une validation vide puis accepte Entrée', async () => {
    render(<GameScreen {...props} />)
    await reachInput()
    const input = screen.getByRole('textbox')

    fireEvent.submit(input.closest('form')!)
    expect(screen.getByRole('textbox')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'x' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByRole('heading', { name: 'Presque !' })).toBeInTheDocument()
  })

  it('met en pause si la fenêtre perd le focus pendant le stimulus', async () => {
    render(<GameScreen {...props} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    fireEvent.blur(window)

    expect(screen.getByRole('heading', { name: 'Pause' })).toBeInTheDocument()
  })
})
