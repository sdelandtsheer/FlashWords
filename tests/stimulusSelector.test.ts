import { selectStimulus } from '../src/game/stimulusSelector'
import type { Stimulus } from '../src/types/game'

const makeStimulus = (id: string, level = 4, enabled = true): Stimulus => ({
  id,
  text: id,
  type: 'word',
  letterCount: level,
  difficulty: level,
  themes: ['test'],
  enabled,
})

describe('selectStimulus', () => {
  const corpus = [makeStimulus('chat'), makeStimulus('lune'), makeStimulus('hors', 5)]

  it('respecte le niveau et le statut actif', () => {
    expect(
      selectStimulus([...corpus, makeStimulus('stop', 4, false)], 4, {
        recentIds: [],
        usedIds: [],
        missedIds: [],
        random: () => 0,
      })?.letterCount,
    ).toBe(4)
  })

  it('évite une répétition immédiate', () => {
    expect(
      selectStimulus(corpus, 4, {
        recentIds: ['chat'],
        usedIds: ['chat'],
        missedIds: [],
        random: () => 0,
      })?.id,
    ).toBe('lune')
  })

  it('accepte la répétition quand le niveau ne contient qu’un élément', () => {
    expect(
      selectStimulus([makeStimulus('seul')], 4, {
        recentIds: ['seul'],
        usedIds: ['seul'],
        missedIds: [],
        random: () => 0,
      })?.id,
    ).toBe('seul')
  })

  it('réintroduit plus tard un stimulus raté', () => {
    expect(
      selectStimulus(corpus, 4, {
        recentIds: [],
        usedIds: ['chat', 'lune'],
        missedIds: ['chat'],
        random: () => 0,
      })?.id,
    ).toBe('chat')
  })
})
