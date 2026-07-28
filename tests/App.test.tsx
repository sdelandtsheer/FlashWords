import { render, screen } from '@testing-library/react'

import { App } from '../src/App'

describe('App', () => {
  it("affiche l'identité du jeu et son action principale", () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'FlashWords' })).toBeInTheDocument()
    expect(screen.getByText('Observe. Mémorise. Écris.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jouer' })).toBeEnabled()
  })
})
