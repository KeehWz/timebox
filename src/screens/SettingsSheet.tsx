import { useState } from 'react'
import { BORDER, TEXT, TEXT2, TEXT3 } from '../ui/tokens'
import type { Settings } from '../domain/types'

const NUDGE_OPTIONS = [['off', 'Off'], ['60', '60m'], ['90', '90m'], ['120', '2h']]

export function SettingsSheet({ settings, onChange, onClose }: {
  settings: Settings
  onChange: (updates: Partial<Settings>) => void
  onClose: () => void
}) {
  const [showCustom, setShowCustom] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(settings.customNudgeMinutes)
  const { nudgeAfter } = settings

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="end-confirm animate-fade-in" onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Settings</p>
        <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em', marginBottom: 8 }}>A gentle invitation</p>
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6, marginBottom: 24 }}>When time stays unmarked, TimeBox can quietly invite you to notice.</p>
        <div style={{ padding: '16px 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ display: 'block', fontSize: 12, color: TEXT2, marginBottom: 10 }}>Remind me if time stays unmarked</span>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {NUDGE_OPTIONS.map(([value, label]) => (
              <button key={value} className={`nudge-chip ${nudgeAfter === value ? 'is-selected' : ''}`} onClick={() => onChange({ nudgeAfter: value })}>{label}</button>
            ))}
            <button className={`nudge-chip ${nudgeAfter === 'custom' ? 'is-selected' : ''}`} onClick={() => setShowCustom(true)}>
              {nudgeAfter === 'custom' ? `${settings.customNudgeMinutes}m` : 'Custom'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: TEXT3, lineHeight: 1.55, marginTop: 14, marginBottom: 24 }}>Rest, leisure, and unstructured time are all valid parts of a day.</p>
        <button className="confirm-primary" onClick={onClose}>Done</button>
      </div>
      {showCustom && (
        <div className="custom-nudge-sheet settings-custom-sheet" onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.11em', textTransform: 'uppercase', marginBottom: 24 }}>Custom reminder</p>
          <div className="custom-time-stepper">
            <button onClick={() => setCustomMinutes(value => Math.max(15, value - 15))}>−</button>
            <span>{Math.floor(customMinutes / 60) > 0 ? `${Math.floor(customMinutes / 60)}h ` : ''}{customMinutes % 60 ? `${customMinutes % 60}m` : ''}</span>
            <button onClick={() => setCustomMinutes(value => Math.min(360, value + 15))}>+</button>
          </div>
          <button className="confirm-primary" onClick={() => { onChange({ nudgeAfter: 'custom', customNudgeMinutes: customMinutes }); setShowCustom(false) }}>Done</button>
        </div>
      )}
    </div>
  )
}
