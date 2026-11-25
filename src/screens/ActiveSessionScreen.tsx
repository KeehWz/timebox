import { useRef, useState } from 'react'
import { PRIMARY_COBALT, RECORD_BG, TEXT, TEXT2, TEXT3 } from '../ui/tokens'
import { HoldToEnd } from '../ui/HoldToEnd'
import { formatDuration, formatElapsed } from '../domain/format'
import { activeElapsed, sessionDuration } from '../domain/time'
import type { ActiveSession, Session } from '../domain/types'
import { useNow } from '../hooks/useNow'

export function ActiveSessionScreen({ active, sessions, dayStartTime, onPause, onResume, onEnd }: {
  active: ActiveSession; sessions: Session[]; dayStartTime: number
  onPause: () => void; onResume: () => void; onEnd: () => void
}) {
  const elapsed = activeElapsed(active, useNow())
  const [timerVisible, setTimerVisible] = useState(true)
  const [showGlance, setShowGlance] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const touchStartY = useRef(0)
  const accent = PRIMARY_COBALT

  const formatted = formatElapsed(elapsed)
  const isLong = formatted.split(':').length > 2

  return (
    <div
      onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
      onTouchEnd={e => {
        const delta = e.changedTouches[0].clientY - touchStartY.current
        if (delta < -55) setShowGlance(true)
        if (delta > 55) setShowGlance(false)
      }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: RECORD_BG, position: 'relative', overflow: 'hidden' }}
      className="active-atmosphere is-warm animate-fade-soft"
    >

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 32px 0' }}>
        <p style={{ fontSize: 12, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 9, fontWeight: 600 }}>
          {active.typeName}
        </p>
        {active.description && (
          <p style={{ fontSize: 15, color: TEXT2, textAlign: 'center', maxWidth: 250, lineHeight: 1.55, marginBottom: 8 }}>
            {active.description}
          </p>
        )}
        {active.focusEnabled && <span className="focused-period-indicator">Focused period</span>}
        {active.isPaused && <span style={{ fontSize: 11, color: TEXT3, marginTop: 6 }}>Paused</span>}

        {/* Timer continues whether its number is visible or not. */}
        <button onClick={() => setTimerVisible(v => !v)} aria-label={timerVisible ? 'Hide elapsed time' : 'Show elapsed time'} className="timer-visibility-control">
          <span className={`visible-timer ${timerVisible ? 'is-visible' : ''}`} style={{ fontSize: isLong ? 54 : 68 }}>{formatted}</span>
          <span className={`ambient-time-symbol ${timerVisible ? '' : 'is-visible'}`}><i /><i /></span>
        </button>
        <span style={{ fontSize: 11, color: TEXT3 }}>{timerVisible ? 'tap time to hide' : 'tap symbol to reveal time'}</span>
      </div>

      <div className="active-controls">
        <div className="pause-control-group">
          <button
            onClick={active.isPaused ? onResume : onPause}
            className={`pause-control ${active.isPaused ? 'is-paused' : ''}`}
            aria-label={active.isPaused ? 'Resume session' : 'Pause session'}
          >
            <span className="pause-bars"><i /><i /></span>
            <span className="play-glyph">
              <svg width={18} height={20} viewBox="0 0 18 20" aria-hidden="true">
                <path d="M4.2 2.8C4.2 1.55 5.58.8 6.62 1.49l9.02 6.02c1.82 1.21 1.82 3.77 0 4.98l-9.02 6.02c-1.04.69-2.42-.06-2.42-1.31V2.8Z" fill="currentColor" />
              </svg>
            </span>
          </button>
          <span className="control-label-stack">
            <span className={active.isPaused ? '' : 'is-visible'}>Pause</span>
            <span className={active.isPaused ? 'is-visible' : ''}>Resume</span>
          </span>
        </div>

        <HoldToEnd onComplete={onEnd} onConfirmRequest={() => setShowEndConfirm(true)} color={accent} />
      </div>
      <button className="glance-handle" onClick={() => setShowGlance(true)}>Today so far <span>↑</span></button>

      <div className={`active-glance ${showGlance ? 'is-visible' : ''}`}>
        <button className="glance-close" onClick={() => setShowGlance(false)} aria-label="Return to active session">↓</button>
        <p style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Today so far</p>
        <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, marginBottom: 22 }}>The shape of your day</p>
        <div className="glance-timeline">
          {sessions.filter(s => s.endTime >= dayStartTime).slice(-5).map(session => (
            <div key={session.id}>
              <span>{session.description || session.typeName}</span>
              <strong>{formatDuration(sessionDuration(session))}</strong>
            </div>
          ))}
          <div className="is-current">
            <span>{active.description || active.typeName}</span>
            <strong>now</strong>
          </div>
        </div>
        <p style={{ fontSize: 12, color: TEXT3, marginTop: 22 }}>Your session keeps recording here.</p>
      </div>

      {showEndConfirm && (
        <div className="modal-veil" onClick={() => setShowEndConfirm(false)}>
          <div className="end-confirm animate-fade-in" role="dialog" aria-label="End session" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>End session</p>
            <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em', marginBottom: 28 }}>Close this recording?</p>
            <button autoFocus className="confirm-primary" onClick={onEnd}>End session</button>
            <button className="confirm-secondary" onClick={() => setShowEndConfirm(false)}>Not yet</button>
          </div>
        </div>
      )}
    </div>
  )
}
