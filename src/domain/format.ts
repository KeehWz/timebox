/** Timer face: `mm:ss`, or `h:mm:ss` past an hour. */
export function formatElapsed(ms: number): string {
  const s = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** Soft duration: `1h 5m`, `2h`, `12m`, or "a moment" under a minute. */
export function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  const rm = m % 60
  if (h > 0 && rm > 0) return `${h}h ${rm}m`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return 'a moment'
}

/** Totals: like formatDuration but `0m` instead of "a moment". */
export function formatRecordedTotal(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

export function formatSinceStart(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}m`
}

export function formatClock(ts: number): string {
  const d = new Date(ts)
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return `${h}:${m}${ampm}`
}

export function colorWithAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return color
  const value = Number.parseInt(hex, 16)
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}
