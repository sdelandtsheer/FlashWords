import groups from './groups.json'
import letters from './letters.json'
import sentences from './sentences.json'
import syllables from './syllables.json'
import words from './words.json'
import type { Stimulus } from '../types/game'

export const corpus = [...letters, ...syllables, ...words, ...groups, ...sentences] as Stimulus[]
export const maxCorpusLevel = Math.max(...corpus.map((stimulus) => stimulus.letterCount))
