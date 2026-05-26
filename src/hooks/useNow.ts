import { useEffect, useState } from 'react'

export const TICK_INTERVAL_MS = 1000

/**
 * Returns the current epoch time, refreshed every `intervalMs` and whenever the tab regains
 * focus. Elapsed durations are always DERIVED from this value (now − startedAt − paused),
 * never accumulated — so the timer can't drift when the tab is backgrounded or throttled,
 * and it self-corrects after a reload.
 */
export function useNow(intervalMs: number = TICK_INTERVAL_MS): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])

  return now
}
