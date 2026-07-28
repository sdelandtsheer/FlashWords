const TYPOGRAPHIC_APOSTROPHES = /[\u2018\u2019\u02bc\u0060\u00b4]/gu
const NON_BREAKING_SPACES = /[\u00a0\u202f]/gu
const ENDING_PUNCTUATION = /[\s.!?…,:;]+$/gu

export function normalizeAnswer(text: string): string {
  return text
    .replace(TYPOGRAPHIC_APOSTROPHES, "'")
    .replace(NON_BREAKING_SPACES, ' ')
    .replace(/œ/giu, (character) => (character === 'Œ' ? 'OE' : 'oe'))
    .replace(/æ/giu, (character) => (character === 'Æ' ? 'AE' : 'ae'))
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
    .replace(/\s+/gu, ' ')
    .replace(ENDING_PUNCTUATION, '')
}

export function countLetters(text: string): number {
  return [...text].filter((character) => /\p{L}/u.test(character)).length
}

export function answersMatch(answer: string, stimulus: string): boolean {
  return normalizeAnswer(answer) === normalizeAnswer(stimulus)
}
