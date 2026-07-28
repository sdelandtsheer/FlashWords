export function streakBonus(streak: number): number {
  if (streak >= 6) return 125
  if (streak === 5) return 100
  if (streak === 4) return 75
  if (streak === 3) return 50
  return 0
}

export function pointsForSuccess(level: number, newStreak: number): number {
  return 100 + 10 * level + streakBonus(newStreak)
}
