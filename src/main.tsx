import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import './styles/global.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error("L'élément racine de l'application est introuvable.")
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
