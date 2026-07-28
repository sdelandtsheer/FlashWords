const UNDER_TWENTY = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
] as const

export function levelToFrench(level: number): string {
  if (!Number.isInteger(level) || level < 0 || level > 60) return String(level)
  if (level < 20) return UNDER_TWENTY[level] ?? String(level)
  if (level === 60) return 'soixante'

  const tens = Math.floor(level / 10)
  const unit = level % 10
  const stem = tens === 2 ? 'vingt' : tens === 3 ? 'trente' : tens === 4 ? 'quarante' : 'cinquante'
  if (unit === 0) return stem
  if (unit === 1) return `${stem} et un`
  return `${stem}-${UNDER_TWENTY[unit]}`
}
