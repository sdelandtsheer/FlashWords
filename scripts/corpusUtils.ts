import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { Stimulus, StimulusType } from '../src/types/game'
import { countLetters, normalizeAnswer } from '../src/game/normalization'

const TYPES: StimulusType[] = ['letter', 'syllable', 'word', 'group', 'sentence']

export function loadCorpus(): Stimulus[] {
  return TYPES.flatMap((type) => {
    const path = resolve('src/data', `${type}s.json`)
    return JSON.parse(readFileSync(path, 'utf8')) as Stimulus[]
  })
}

export interface CorpusIssue {
  severity: 'error' | 'warning'
  message: string
}

export function inspectCorpus(corpus: Stimulus[]): CorpusIssue[] {
  const issues: CorpusIssue[] = []
  const ids = new Set<string>()
  const exactTexts = new Set<string>()
  const normalizedTexts = new Set<string>()

  for (const stimulus of corpus) {
    if (!stimulus.text.trim())
      issues.push({ severity: 'error', message: `${stimulus.id}: texte vide` })
    if (ids.has(stimulus.id))
      issues.push({ severity: 'error', message: `${stimulus.id}: identifiant dupliqué` })
    ids.add(stimulus.id)

    if (exactTexts.has(stimulus.text))
      issues.push({ severity: 'error', message: `${stimulus.id}: texte exact dupliqué` })
    exactTexts.add(stimulus.text)

    const normalized = normalizeAnswer(stimulus.text)
    if (normalizedTexts.has(normalized))
      issues.push({ severity: 'error', message: `${stimulus.id}: texte normalisé dupliqué` })
    normalizedTexts.add(normalized)

    const actualCount = countLetters(stimulus.text)
    if (stimulus.letterCount !== actualCount || stimulus.difficulty !== actualCount) {
      issues.push({
        severity: 'error',
        message: `${stimulus.id}: ${actualCount} lettres calculées, ${stimulus.letterCount} déclarées`,
      })
    }
    if (!TYPES.includes(stimulus.type))
      issues.push({ severity: 'error', message: `${stimulus.id}: type invalide` })
    if (stimulus.letterCount < 1 || stimulus.letterCount > 60)
      issues.push({ severity: 'error', message: `${stimulus.id}: niveau hors limites` })
    if (stimulus.type === 'sentence' && !/[.!?…]$/u.test(stimulus.text))
      issues.push({ severity: 'error', message: `${stimulus.id}: ponctuation finale absente` })
    if (!/^[\p{L}\p{M}\p{N}\s'’.,!?…:;-]+$/u.test(stimulus.text))
      issues.push({ severity: 'error', message: `${stimulus.id}: caractère inattendu` })
  }

  for (let level = 1; level <= 60; level += 1) {
    const count = corpus.filter((stimulus) => stimulus.letterCount === level).length
    if (count === 0) issues.push({ severity: 'error', message: `Niveau ${level}: aucun stimulus` })
    const target = level === 1 ? 26 : level <= 20 ? 30 : level <= 40 ? 20 : 10
    if (count < target)
      issues.push({
        severity: 'warning',
        message: `Niveau ${level}: ${count}/${target} stimuli recommandés`,
      })
  }
  return issues
}
