import { answersMatch, countLetters, normalizeAnswer } from '../src/game/normalization'

describe('normalizeAnswer', () => {
  it.each([
    ['École', 'ecole'],
    ['GARÇON', 'garcon'],
    ['où', 'ou'],
    ['cœur', 'coeur'],
    ['L’ÉTÉ', "l'ete"],
    ['  deux   mots  ', 'deux mots'],
    ['route\u00a0bleue', 'route bleue'],
    ['ŒUF', 'oeuf'],
    ['cæsar', 'caesar'],
    ['Bonjour?! ', 'bonjour'],
    ['', ''],
  ])('normalise %j en %j', (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected)
  })

  it('refuse les véritables fautes', () => {
    expect(answersMatch('le chateu', 'Le château.')).toBe(false)
    expect(answersMatch('le grand chateau', 'Le château.')).toBe(false)
    expect(answersMatch('LE CHATEAU', 'Le château.')).toBe(true)
  })
})

describe('countLetters', () => {
  it.each([
    ['à', 1],
    ['où', 2],
    ["l'ami", 4],
    ['arc-en-ciel', 9],
    ['Le chat dort.', 10],
    ['cœur', 4],
  ])('compte %j comme %i lettres', (text, expected) => {
    expect(countLetters(text)).toBe(expected)
  })
})
