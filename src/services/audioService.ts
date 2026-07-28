let context: AudioContext | null = null

function tone(frequency: number, endFrequency: number, volume: number): void {
  try {
    context ??= new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + 0.18)
    gain.gain.setValueAtTime(Math.min(0.12, volume * 0.12), now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.23)
  } catch {
    // L'audio n'est jamais bloquant.
  }
}

export function playSuccess(volume: number): void {
  tone(520, 760, volume)
}

export function playFailure(volume: number): void {
  tone(300, 190, volume)
}
