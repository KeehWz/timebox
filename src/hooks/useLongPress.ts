import { useCallback, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

export const HOLD_DURATION_MS = 1700 // within the product's 1.5–2s "completion ritual" range

export interface LongPressHandlers {
  onPointerDown: (e: ReactPointerEvent) => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onPointerCancel: () => void
  onContextMenu: (e: ReactMouseEvent) => void
}

export interface UseLongPressResult {
  progress: number // 0..1, fills while held
  handlers: LongPressHandlers
}

/**
 * Press-and-hold gesture. `onComplete` fires exactly once when the hold reaches `duration`.
 * Releasing early cancels and resets progress to 0. Uses Pointer Events (touch + mouse) and
 * requestAnimationFrame for smooth progress; performance.now() gives monotonic timing.
 */
export function useLongPress(
  onComplete: () => void,
  duration: number = HOLD_DURATION_MS,
): UseLongPressResult {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const firedRef = useRef(false)

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const begin = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault()
      firedRef.current = false
      startRef.current = performance.now()
      stop()
      // Named function expression so the rAF loop can reference itself without a
      // self-referential useCallback (which react-hooks/immutability disallows).
      rafRef.current = requestAnimationFrame(function step() {
        const elapsed = performance.now() - startRef.current
        const next = Math.min(1, elapsed / duration)
        setProgress(next)
        if (next >= 1) {
          stop()
          if (!firedRef.current) {
            firedRef.current = true
            onComplete()
          }
          return
        }
        rafRef.current = requestAnimationFrame(step)
      })
    },
    [duration, onComplete, stop],
  )

  const cancel = useCallback(() => {
    stop()
    setProgress(0)
  }, [stop])

  return {
    progress,
    handlers: {
      onPointerDown: begin,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    },
  }
}
