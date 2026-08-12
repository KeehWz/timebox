import type { Session } from './session'
import { activeMs } from './metrics'
import { addDays, toDayKey } from './time'

/** The 7 local dayKeys (Monday → Sunday) of the week containing `now`. */
export function weekDayKeys(now: number): string[] {
  const today = toDayKey(now)
  const weekday = (new Date(now).getDay() + 6) % 7 // 0 = Monday
  const monday = addDays(today, -weekday)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/**
 * Focus ms per dayKey. Completed sessions always count; a still-running session counts its
 * elapsed time (so "today" matches the home screen's live total).
 */
export function focusMsByDay(sessions: readonly Session[], now: number): Record<string, number> {
  const byDay: Record<string, number> = {}
  for (const session of sessions) {
    byDay[session.dayKey] = (byDay[session.dayKey] ?? 0) + activeMs(session, now)
  }
  return byDay
}

/**
 * Consecutive days with any focus, counting back from today (or from yesterday when today is
 * still empty — an untouched morning shouldn't read as a broken streak).
 */
export function currentStreak(byDay: Record<string, number>, today: string): number {
  let streak = 0
  let cursor = (byDay[today] ?? 0) > 0 ? today : addDays(today, -1)
  while ((byDay[cursor] ?? 0) > 0) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}
