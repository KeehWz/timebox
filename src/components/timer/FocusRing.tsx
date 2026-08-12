/* Geometry ported 1:1 from Timebox.dc.html (250px ring, r=108, 10px stroke). */
const SIZE = 250
const RADIUS = 108
const STROKE = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface FocusRingProps {
  /**
   * 0..1 sweep of the current minute. The timer counts up (open-ended), so instead of the
   * design's depleting countdown arc, the ring refills once per minute like a second hand.
   */
  progress: number
}

export function FocusRing({ progress }: FocusRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))
  // At each minute wrap the arc snaps back to empty; animating that would sweep the ring
  // backwards for a second. Updates arrive once per second, so a progress inside the first
  // sweep-second identifies the wrap frame — suppress the transition exactly there.
  const wrapped = clamped < 1.5 / 60
  const offset = CIRCUMFERENCE * (1 - clamped)
  const center = SIZE / 2

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke="var(--color-track)"
        strokeWidth={STROKE}
      />
      <circle
        cx={center}
        cy={center}
        r={RADIUS}
        fill="none"
        stroke="var(--accent, var(--color-accent))"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: wrapped ? 'none' : 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  )
}
