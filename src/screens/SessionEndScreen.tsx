import { useState } from 'react'
import { BORDER, PRIMARY_COBALT, TEXT, TEXT3, WHITE } from '../ui/tokens'
import { formatClock, formatDuration } from '../domain/format'
import { sessionDuration } from '../domain/time'
import type { Session } from '../domain/types'

export function SessionEndScreen({ session, onContinue }: { session: Session; onContinue: (description: string) => void }) {
  const [desc, setDesc] = useState(session.description)
  const duration = sessionDuration(session)
  const accent = PRIMARY_COBALT

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '80px 32px 48px', background: WHITE }} className="animate-fade-in">
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>
          {session.typeName}
        </p>
        <p style={{ fontSize: 48, fontWeight: 300, color: TEXT, letterSpacing: '-0.025em', marginBottom: 4 }}>
          {formatDuration(duration)}
        </p>
        <p style={{ fontSize: 14, color: TEXT3, marginBottom: 48 }}>
          {formatClock(session.startTime)} — {formatClock(session.endTime)}
        </p>
        {session.focusedDuration !== undefined && session.focusedDuration > 0 && (
          <div className="focused-summary">
            <span>Focused period</span>
            <strong>{formatDuration(session.focusedDuration)}</strong>
          </div>
        )}

        <div>
          <p style={{ fontSize: 11, color: TEXT3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Notes</p>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="What was this time for?"
            rows={3}
            style={{
              width: '100%', background: '#F8F9FB',
              border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '14px 16px', fontSize: 15, color: TEXT,
              outline: 'none', fontFamily: 'inherit', resize: 'none',
              lineHeight: 1.6, boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: 12, color: TEXT3, marginTop: 8 }}>Editing here only affects this recording.</p>
        </div>
      </div>

      <button
        onClick={() => onContinue(desc)}
        style={{
          width: '100%', padding: '16px',
          background: TEXT, color: WHITE,
          border: 'none', borderRadius: 14,
          fontSize: 15, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Continue
      </button>
    </div>
  )
}
