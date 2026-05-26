import type { CategoryId, Session } from './session'
import { activeMs, totalPausedMs, totalSpanMs } from './metrics'

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** "HH:MM:SS" — hours grow unbounded, minutes/seconds zero-padded. For the live timer. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / MS_PER_SECOND))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
}

/** Human duration: "1h 14m", "40m", "1m 30s", "44s", "0s". For summaries and totals. */
export function formatHuman(ms: number): string {
  const clamped = Math.max(0, ms)
  const hours = Math.floor(clamped / MS_PER_HOUR)
  const minutes = Math.floor((clamped % MS_PER_HOUR) / MS_PER_MINUTE)
  const seconds = Math.floor((clamped % MS_PER_MINUTE) / MS_PER_SECOND)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  return `${seconds}s`
}

/** "HH:MM" local 24-hour clock for an epoch timestamp. */
export function formatTimeOfDay(epochMs: number): string {
  const d = new Date(epochMs)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** Local 'YYYY-MM-DD' for an epoch timestamp. Uses LOCAL date parts (never UTC / toISOString). */
export function toDayKey(epochMs: number): string {
  const d = new Date(epochMs)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** The dayKey `n` days after the given local dayKey (n may be negative). */
export function addDays(dayKey: string, n: number): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day) // local midnight
  date.setDate(date.getDate() + n)
  return toDayKey(date.getTime())
}

export interface DaySummary {
  byCategory: Partial<Record<CategoryId, number>> // focus ms per category (completed sessions only)
  pausedTotalMs: number
  spanTotalMs: number
}

/**
 * Roll up a day's sessions. Only completed sessions contribute (active ones are still running).
 * Authoritative metric definitions: focus = span − paused; span = end − start.
 */
export function summarizeDay(sessions: readonly Session[], now: number): DaySummary {
  const byCategory: Partial<Record<CategoryId, number>> = {}
  let pausedTotalMs = 0
  let spanTotalMs = 0
  for (const session of sessions) {
    if (session.status !== 'completed') continue
    byCategory[session.categoryId] = (byCategory[session.categoryId] ?? 0) + activeMs(session, now)
    pausedTotalMs += totalPausedMs(session, now)
    spanTotalMs += totalSpanMs(session, now)
  }
  return { byCategory, pausedTotalMs, spanTotalMs }
}
