import type { ChallengeProgress } from './challenge'

/** First-session reminder settings (spec §2, web-limited — see v2 plan Decision 4). */
export interface ReminderPrefs {
  /** Local 'HH:MM' to nudge if no session has been started yet; null = off. */
  firstSessionTime: string | null
}

/** "Still drifting?" prompt cadence (spec §9 optional behavior). null = off. */
export interface DriftPromptPrefs {
  intervalMinutes: number | null
}

/**
 * Typed catalog of every pref (single-user local app — no User table; v2 plan Decision 6).
 * Stored as one row per key in the `prefs` table.
 */
export interface PrefsShape {
  onboardingCompleted: boolean
  challenge: ChallengeProgress
  reminder: ReminderPrefs
  /** dayKey the first-session reminder last fired on (fire at most once per day). */
  reminderLastFiredOn: string
  driftPrompt: DriftPromptPrefs
}

export type PrefKey = keyof PrefsShape
