import type { CategoryId, Session } from './session'
import type { Locale } from '../i18n/locale'
import { activeMs, totalPausedMs, totalSpanMs } from './metrics'

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE

const DURATION_UNITS: Record<Locale, { h: string; m: string; s: string }> = {
  en: { h: 'h', m: 'm', s: 's' },
  zh: { h: '时', m: '分', s: '秒' },
}

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

/** Locale-aware duration: en "1h 14m"/"44s"/"0s"; zh "1时14分"/"44秒"/"0秒". */
export function formatDuration(ms: number, locale: Locale): string {
  const u = DURATION_UNITS[locale]
  const sep = locale === 'zh' ? '' : ' '
  const clamped = Math.max(0, ms)
  const hours = Math.floor(clamped / MS_PER_HOUR)
  const minutes = Math.floor((clamped % MS_PER_HOUR) / MS_PER_MINUTE)
  const seconds = Math.floor((clamped % MS_PER_MINUTE) / MS_PER_SECOND)
  if (hours > 0) return `${hours}${u.h}${sep}${minutes}${u.m}`
  if (minutes > 0) return seconds > 0 ? `${minutes}${u.m}${sep}${seconds}${u.s}` : `${minutes}${u.m}`
  return `${seconds}${u.s}`
}

/** Convenience: English duration. Equivalent to formatDuration(ms, 'en'). */
export function formatHuman(ms: number): string {
  return formatDuration(ms, 'en')
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

/** Epoch ms for a local 'HH:MM' time-of-day on the given local dayKey. */
export function dayKeyTimeToEpoch(dayKey: string, timeOfDay: string): number {
  const [year, month, day] = dayKey.split('-').map(Number)
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes).getTime()
}

/** The dayKey `n` days after the given local dayKey (n may be negative). */
export function addDays(dayKey: string, n: number): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day) // local midnight
  date.setDate(date.getDate() + n)
  return toDayKey(date.getTime())
}

/** Localized long date for a local dayKey: zh "2026年5月28日"; en "May 28, 2026". */
export function dayKeyLabel(dayKey: string, locale: Locale): string {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
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
