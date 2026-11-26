import { formatDuration } from './format'
import { roughAmountMinutes } from './time'
import type { ActiveSession, DayState, Session, Settings } from './types'

// The two local notifications the iOS app can have pending. Each is planned from the current
// state, so whenever the state changes the pending ones are simply replaced.

export const SESSION_NUDGE_ID = 1
export const UNMARKED_ID = 2

/** The unmarked-time reminder never lands in the night: 22:00–07:00 local. */
const QUIET_FROM_HOUR = 22
const QUIET_UNTIL_HOUR = 7

export interface PlannedNotification {
  id: number
  at: number // epoch ms
  title: string
  body: string
}

/** "Nudge me" in session setup: '' | 'Off' | '60m' | '90m' | '2h' | 'custom-45m'. */
export function reminderMinutes(reminder: string): number {
  return roughAmountMinutes(reminder.replace(/^custom-/, ''))
}

/** "Remind me if time stays unmarked" in Settings. */
export function unmarkedMinutes(settings: Settings): number {
  if (settings.nudgeAfter === 'off') return 0
  if (settings.nudgeAfter === 'custom') return settings.customNudgeMinutes
  return Number(settings.nudgeAfter) || 0
}

function inQuietHours(ts: number) {
  const hour = new Date(ts).getHours()
  return hour >= QUIET_FROM_HOUR || hour < QUIET_UNTIL_HOUR
}

export function planNotifications(
  state: { day: DayState; active: ActiveSession | null; sessions: Session[]; settings: Settings },
  now: number,
): PlannedNotification[] {
  const { day, active, sessions, settings } = state
  const planned: PlannedNotification[] = []

  // A single check-in once the session has run for the chosen time. Paused time does not count,
  // so a paused session has nothing pending until it resumes.
  const nudge = active ? reminderMinutes(active.reminder) : 0
  if (active && nudge > 0 && !active.isPaused) {
    const at = active.startTime + active.pausedDuration + nudge * 60_000
    if (at > now) {
      planned.push({
        id: SESSION_NUDGE_ID,
        at,
        title: active.typeName,
        body: `A gentle check-in — ${formatDuration(nudge * 60_000)} so far.`,
      })
    }
  }

  // Unmarked time: counted from the last moment something was marked today.
  const unmarked = unmarkedMinutes(settings)
  if (unmarked > 0 && day.started && !day.endTime && !active) {
    const lastMark = sessions
      .filter(session => session.startTime >= day.startTime)
      .reduce((latest, session) => Math.max(latest, session.endTime), day.startTime)
    const at = lastMark + unmarked * 60_000
    if (at > now && !inQuietHours(at)) {
      planned.push({ id: UNMARKED_ID, at, title: 'TimeBox', body: 'Ready to mark your time?' })
    }
  }

  return planned
}
