import { useState } from 'react'
import { BORDER, GOLD, GOLD_BG, TEXT, TEXT2, TEXT3, WARM_BG, WARM_LIGHT, WHITE } from '../ui/tokens'
import { formatClock, formatDuration } from '../domain/format'
import { buildDayBlocks } from '../domain/stats'
import { sessionDuration } from '../domain/time'
import type { Direction, Session, SessionType } from '../domain/types'

export function EndDayReflectionScreen({ sessions, directions, dayStartTime, dayEndTime, sessionTypes, onDone }: {
  sessions: Session[]; directions: Direction[]; dayStartTime: number; dayEndTime: number
  sessionTypes: SessionType[]; onDone: (reflection: string) => void
}) {
  const [stage, setStage] = useState(0)
  const [reflection, setReflection] = useState('')

  const todaySessions = sessions.filter(s => s.startTime >= dayStartTime && s.startTime <= dayEndTime)
  const breakdown: Record<string, number> = {}
  for (const s of todaySessions) {
    const dur = sessionDuration(s)
    breakdown[s.typeName] = (breakdown[s.typeName] || 0) + dur
  }
  const totalMs = dayEndTime - dayStartTime
  const recordedMs = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const unrecordedMs = Math.max(0, totalMs - recordedMs)

  // End-of-day uses pale gold as a subtle retrospective accent
  const isClosing = stage === 4
  const reflectionBlocks = buildDayBlocks(todaySessions, dayStartTime, dayEndTime)

  const stages = [
    // 0: stats
    <div key={0} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <p style={{ fontSize: 11, color: TEXT3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>Today</p>
      <p style={{ fontSize: 44, fontWeight: 300, color: TEXT, letterSpacing: '-0.025em', marginBottom: 4 }}>{formatDuration(recordedMs)}</p>
      <p style={{ fontSize: 14, color: TEXT3, marginBottom: 40 }}>recorded</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.entries(breakdown).map(([name, ms]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, color: TEXT2 }}>{name}</span>
            <span style={{ fontSize: 16, color: TEXT }}>{formatDuration(ms)}</span>
          </div>
        ))}
        {unrecordedMs > 60000 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, color: TEXT3, fontStyle: 'italic' }}>unrecorded</span>
            <span style={{ fontSize: 16, color: TEXT3 }}>{formatDuration(unrecordedMs)}</span>
          </div>
        )}
      </div>
    </div>,

    // 1: direction
    <div key={1} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <p style={{ fontSize: 11, color: TEXT3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>Today's Direction</p>
      {directions.length === 0 ? (
        <p style={{ fontSize: 16, color: TEXT3, fontStyle: 'italic' }}>No direction was set for today.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {directions.map(dir => {
            const type = sessionTypes.find(t => t.id === dir.typeId) || { name: dir.typeId }
            const recorded = todaySessions.filter(s => s.typeId === dir.typeId).reduce((a, s) => a + sessionDuration(s), 0)
            return (
              <div key={dir.typeId}>
                <div style={{ fontSize: 16, fontWeight: 500, color: TEXT, marginBottom: 4 }}>{type.name}</div>
                <div style={{ fontSize: 13, color: TEXT3, marginBottom: 2 }}>{dir.roughAmount !== 'no amount' ? `around ${dir.roughAmount}` : 'no amount set'}</div>
                <div style={{ fontSize: 15, color: TEXT2 }}>{formatDuration(recorded)} recorded</div>
              </div>
            )
          })}
        </div>
      )}
    </div>,

    // 2: complete timeline
    <div key={2} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: 24 }}>
      <p style={{ fontSize: 11, color: TEXT3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>The shape of today</p>
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
        <p style={{ fontSize: 11, color: TEXT3, marginBottom: 8 }}>{formatClock(dayStartTime)} · Start Today</p>
        {reflectionBlocks.map((block, index) => {
          const duration = block.end - block.start
          return (
            <div key={index} style={{
              minHeight: Math.max(42, Math.min(96, duration / 120000)),
              padding: '10px 12px', marginBottom: 5, borderRadius: 12,
              background: block.type === 'unrecorded' ? '#FAFAFA' : WARM_BG,
              border: `1px solid ${block.type === 'unrecorded' ? BORDER : WARM_LIGHT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: block.type === 'unrecorded' ? TEXT3 : TEXT }}>
                {block.type === 'unrecorded' ? 'Unrecorded' : block.session!.description || block.session!.typeName}
              </span>
              <span style={{ fontSize: 12, color: TEXT3 }}>{formatDuration(duration)}</span>
            </div>
          )
        })}
        <p style={{ fontSize: 11, color: TEXT3, marginTop: 8 }}>{formatClock(dayEndTime)} · End Today</p>
      </div>
    </div>,

    // 3: reflection
    <div key={3} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <p style={{ fontSize: 22, fontWeight: 400, color: TEXT, marginBottom: 16, lineHeight: 1.4, letterSpacing: '-0.01em' }}>Anything you noticed?</p>
      <textarea
        value={reflection}
        onChange={e => setReflection(e.target.value)}
        placeholder="Optional reflection..."
        rows={5}
        style={{
          background: '#FAFAFA', border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: '16px', fontSize: 15, color: TEXT, outline: 'none',
          fontFamily: 'inherit', resize: 'none', lineHeight: 1.7,
          boxSizing: 'border-box', width: '100%',
        }}
      />
    </div>,

    // 4: closure — pale gold accent appears here
    <div key={4} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      {/* Subtle gold ambient orb */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 200, borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, rgba(240,211,154,0.18) 0%, transparent 70%)`,
      }} />
      <div style={{ position: 'relative' }}>
        {/* Gold accent dot */}
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, margin: '0 auto 28px', opacity: 0.7 }} />
        <p style={{ fontSize: 22, fontWeight: 400, color: TEXT2, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
          That's all for today.
        </p>
      </div>
    </div>,
  ]

  const isLast = stage === stages.length - 1

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '60px 32px 48px',
      background: isClosing ? GOLD_BG : WHITE,
      position: 'relative', overflow: 'hidden',
      transition: 'background 1.2s ease',
    }} className="animate-fade-soft">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {stages[stage]}
      </div>
      <button
        onClick={isLast ? () => onDone(reflection) : () => setStage(s => s + 1)}
        style={{
          width: '100%', padding: '15px',
          background: isLast ? TEXT : 'transparent',
          color: isLast ? WHITE : TEXT3,
          border: isLast ? 'none' : `1px solid ${BORDER}`,
          borderRadius: 14, fontSize: 15,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.4s',
        }}
      >
        {isLast ? 'Close' : 'Continue'}
      </button>
    </div>
  )
}
