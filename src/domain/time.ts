import type { ActiveSession, DayState, DirectionItem, Session } from './types'

// ── Calendar helpers (local time) ───────────────────────────────────────────

export function startOfDate(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function addCalendarDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return startOfDate(next)
}

/** Monday-based week start. */
export function startOfCalendarWeek(date: Date): Date {
  const start = startOfDate(date)
  const weekday = start.getDay() || 7
  return addCalendarDays(start, 1 - weekday)
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ── Sessions ────────────────────────────────────────────────────────────────

/** Recorded time of a finished session (wall-clock span minus pauses). */
export function sessionDuration(session: Session): number {
  return Math.max(0, session.endTime - session.startTime - session.pausedDuration)
}

export function sumSessionMs(sessions: Session[], typeId: string, since: number): number {
  return sessions
    .filter(s => s.typeId === typeId && s.startTime >= since)
    .reduce((total, s) => total + sessionDuration(s), 0)
}

/** Elapsed recorded time of the in-progress session; frozen while paused. */
export function activeElapsed(active: ActiveSession, now: number): number {
  const until = active.isPaused && active.pauseStart ? active.pauseStart : now
  return Math.max(0, until - active.startTime - active.pausedDuration)
}

export function pauseActive(active: ActiveSession, now: number): ActiveSession {
  if (active.isPaused) return active
  return { ...active, isPaused: true, pauseStart: now }
}

export function resumeActive(active: ActiveSession, now: number): ActiveSession {
  if (!active.isPaused) return active
  const extra = now - (active.pauseStart ?? now)
  return { ...active, isPaused: false, pauseStart: undefined, pausedDuration: active.pausedDuration + extra }
}

/** Close the in-progress session at `now`. An open pause counts as paused time up to `now`. */
export function finishActive(active: ActiveSession, now: number, id: string): Session {
  let pausedDuration = active.pausedDuration
  if (active.isPaused && active.pauseStart) pausedDuration += now - active.pauseStart
  const recorded = Math.max(0, now - active.startTime - pausedDuration)
  return {
    id,
    typeId: active.typeId,
    typeName: active.typeName,
    description: active.description,
    startTime: active.startTime,
    endTime: now,
    pausedDuration,
    ...(active.focusEnabled ? { focusedDuration: recorded } : {}),
  }
}

// ── Day boundary ────────────────────────────────────────────────────────────

/** A "day" rolls over at 4am local, so a late night still belongs to the day it started in. */
export const DAY_ROLLOVER_HOUR = 4

function rolloverDateKey(ts: number): string {
  return localDateKey(new Date(ts - DAY_ROLLOVER_HOUR * 3600000))
}

/**
 * True when a started day was never closed and we are now past the next 4am rollover.
 * Such a day is closed quietly on the next open instead of counting unrecorded time forever.
 */
export function isStaleDay(day: DayState, now: number): boolean {
  if (!day.started || day.endTime) return false
  return rolloverDateKey(day.startTime) !== rolloverDateKey(now)
}

// ── Direction amounts ───────────────────────────────────────────────────────

export function roughAmountMinutes(amount: string): number {
  const hours = amount.match(/^(\d+)h$/)
  if (hours) return Number(hours[1]) * 60
  const minutes = amount.match(/^(\d+)m$/)
  if (minutes) return Number(minutes[1])
  return 0
}

export function summarizeDirectionItems(items: DirectionItem[]): string {
  const totalMinutes = items.reduce((total, item) => total + roughAmountMinutes(item.roughAmount), 0)
  if (totalMinutes === 0) return 'no amount'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes === 0) return `${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
