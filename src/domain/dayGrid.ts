/**
 * Pure geometry for the Today hour-grid timeline (design: Timebox.dc.html — 56px per hour,
 * blocks positioned by minutes-of-day). The visible window adapts to the day's content but
 * never shrinks below the default 7:00–21:00 span.
 */
export const PX_PER_HOUR = 56
export const MINUTES_PER_DAY = 24 * 60

export interface GridWindow {
  /** Minutes since local midnight, both rounded to whole hours. */
  startMin: number
  endMin: number
}

const DEFAULT_START = 7 * 60
const DEFAULT_END = 21 * 60

export interface GridSpan {
  startMin: number
  endMin: number
}

/** Window covering the default span plus any content outside it, clamped to the day. */
export function gridWindow(spans: readonly GridSpan[]): GridWindow {
  let start = DEFAULT_START
  let end = DEFAULT_END
  for (const span of spans) {
    start = Math.min(start, Math.floor(span.startMin / 60) * 60)
    end = Math.max(end, Math.ceil(span.endMin / 60) * 60)
  }
  return { startMin: Math.max(0, start), endMin: Math.min(MINUTES_PER_DAY, end) }
}

export function gridHeight(window: GridWindow): number {
  return ((window.endMin - window.startMin) / 60) * PX_PER_HOUR
}

/** Y offset in px for a minute-of-day within the window. */
export function yForMinute(minute: number, window: GridWindow): number {
  return ((minute - window.startMin) / 60) * PX_PER_HOUR
}

/** Minute-of-day for a Y offset, snapped down to `snap` minutes and clamped to the window. */
export function minuteForY(y: number, window: GridWindow, snap: number): number {
  const raw = window.startMin + (y / PX_PER_HOUR) * 60
  const snapped = Math.floor(raw / snap) * snap
  return Math.max(window.startMin, Math.min(window.endMin, snapped))
}

/** Clamp a block start so `durationMin` still fits inside the window. */
export function clampBlockStart(startMin: number, durationMin: number, window: GridWindow): number {
  return Math.max(window.startMin, Math.min(window.endMin - durationMin, startMin))
}

/** Hour rules to draw: one line per whole hour across the window, inclusive. */
export function hourMarks(window: GridWindow): number[] {
  const marks: number[] = []
  for (let m = window.startMin; m <= window.endMin; m += 60) marks.push(m)
  return marks
}

export function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${h}:${String(m).padStart(2, '0')}`
}
