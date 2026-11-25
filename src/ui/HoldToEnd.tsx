import type { CSSProperties } from 'react'
import { useLongPress } from '../hooks/useLongPress'

const HOLD_MS = 900

/** Ending a session takes a deliberate hold; releasing early cancels. */
export function HoldToEnd({ onComplete, color }: { onComplete: () => void; color: string }) {
  const { progress, handlers } = useLongPress(onComplete, HOLD_MS)
  const holding = progress > 0 && progress < 1

  return (
    <div className="hold-control-group">
      <button
        {...handlers}
        className={`hold-end-control ${holding ? 'is-holding' : ''}`}
        style={{ '--hold-color': color, '--hold-scale': progress } as CSSProperties}
        aria-label="Hold to end session"
      >
        <span className="hold-end-fill" />
        <span className="end-glyph" />
      </button>
      <span className="compact-control-label">Hold to End</span>
    </div>
  )
}
