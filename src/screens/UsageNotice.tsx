import { TEXT, TEXT2, TEXT3 } from '../ui/tokens'

/**
 * Shown once, on first launch: usage sharing is on by default, so say so and offer the way out
 * before anything is sent. Deliberately not dismissable by tapping outside — it asks for a choice.
 */
export function UsageNotice({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="modal-veil">
      <div className="end-confirm animate-fade-in" role="dialog" aria-label="A note on privacy">
        <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Before you begin</p>
        <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em', marginBottom: 8 }}>A note on privacy</p>
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6, marginBottom: 10 }}>
          TimeBox shares anonymous usage to help improve it: counts and durations, like how long a session ran.
        </p>
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6, marginBottom: 24 }}>
          Your notes, categories and reflections stay on this device. You can change this any time in Settings.
        </p>
        <button className="confirm-primary" onClick={onAccept}>Sounds good</button>
        <button className="confirm-secondary" onClick={onDecline}>Don&apos;t share</button>
      </div>
    </div>
  )
}
