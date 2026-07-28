import { levelToFrench } from '../src/game/frenchNumbers'

it.each([
  [1, 'un'],
  [12, 'douze'],
  [21, 'vingt et un'],
  [34, 'trente-quatre'],
  [60, 'soixante'],
])('écrit le niveau %i en français', (level, expected) => {
  expect(levelToFrench(level)).toBe(expected)
})
