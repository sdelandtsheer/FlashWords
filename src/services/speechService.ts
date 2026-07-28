import { GAME_CONFIG } from '../game/config'
import { levelToFrench } from '../game/frenchNumbers'

export function announceFailure(level: number, volume: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve()
      return
    }
    const utterance = new SpeechSynthesisUtterance(`Échec. Nouveau niveau ${levelToFrench(level)}.`)
    utterance.lang = 'fr-FR'
    utterance.volume = volume
    const voices = window.speechSynthesis.getVoices()
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith('fr')) ?? null

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(safety)
      resolve()
    }
    const safety = window.setTimeout(finish, GAME_CONFIG.speechSafetyMs)
    utterance.onend = finish
    utterance.onerror = finish
    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch {
      finish()
    }
  })
}

export function cancelSpeech(): void {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    // Sans conséquence pour la partie.
  }
}
