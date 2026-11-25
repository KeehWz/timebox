/** A user-defined category of time ("Work", "Exercise", …). */
export interface SessionType {
  id: string
  name: string
  description: string
  presets?: string[]
  iconId?: string
}

/**
 * A finished recording. All timestamps are epoch ms. `typeName` is denormalised on purpose:
 * past records keep the name they were recorded under even if the category is renamed/deleted.
 */
export interface Session {
  id: string
  typeId: string
  typeName: string
  description: string
  startTime: number
  endTime: number
  pausedDuration: number
  focusedDuration?: number
}

export interface DirectionItem {
  preset: string | null // null = "General <category>"
  roughAmount: string // 'no amount' | '30m' | '2h' | …
}

export interface Direction {
  typeId: string
  roughAmount: string
  items?: DirectionItem[]
}

/** The single in-progress recording. Elapsed time is always derived from these timestamps. */
export interface ActiveSession {
  typeId: string
  typeName: string
  description: string
  startTime: number
  pauseStart?: number
  pausedDuration: number
  isPaused: boolean
  focusEnabled: boolean
  reminder: string // '' when no nudge was requested
}

/** "Today" runs from Start Today to End Today — not midnight to midnight. */
export interface DayState {
  started: boolean
  startTime: number
  endTime: number // 0 until End Today is confirmed
}

export interface Settings {
  nudgeAfter: string // 'off' | '60' | '90' | '120' | 'custom'
  customNudgeMinutes: number
  shareUsage: boolean // anonymous usage events; see domain/telemetry.ts
  usageNoticeSeen: boolean // the first-launch privacy note has been answered
}

/** A closed day, kept so reflections and day boundaries are not lost. */
export interface DayRecord {
  startTime: number
  endTime: number
  reflection: string
  directions: Direction[]
}
