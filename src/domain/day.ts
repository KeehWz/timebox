/**
 * A calendar day's lifecycle record (spec §4 Start Day / §14 End Day).
 * Sessions do NOT require a started day — starting a session implicitly starts the day.
 * `endedAt` set = the user explicitly closed the day (reflection moment); it does not block
 * further sessions (day-boundary semantics are an open question in the v2 plan).
 */
export interface Day {
  date: string // local 'YYYY-MM-DD', primary key
  startedAt: number | null // epoch ms
  endedAt: number | null // epoch ms
}
