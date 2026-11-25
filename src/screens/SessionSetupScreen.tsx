import { useState } from 'react'
import { BORDER, PRIMARY_COBALT, RECORD_BG, TEXT, TEXT2, TEXT3, WHITE } from '../ui/tokens'
import { presetsFor } from '../domain/defaults'
import type { Direction, SessionType } from '../domain/types'

export function SessionSetupScreen({ typeId, sessionTypes, directions, onStart, onBack, onAddPreset }: {
  typeId: string; sessionTypes: SessionType[]
  directions: Direction[]
  onStart: (desc: string, focusEnabled: boolean, reminder: string) => void
  onBack: () => void
  onAddPreset: (typeId: string, preset: string) => void
}) {
  const [desc, setDesc] = useState('')
  const [focusEnabled, setFocusEnabled] = useState(false)
  const [nudgeEnabled, setNudgeEnabled] = useState(false)
  const [reminder, setReminder] = useState('90m')
  const [customMinutes, setCustomMinutes] = useState(90)
  const [showCustomNudge, setShowCustomNudge] = useState(false)
  const [showAddPreset, setShowAddPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const savedType: SessionType = sessionTypes.find(t => t.id === typeId) ?? { id: typeId, name: typeId, description: '' }
  const type = { ...savedType, presets: presetsFor(savedType) }
  const directedPresets = new Set(
    (directions.find(direction => direction.typeId === typeId)?.items || [])
      .map(item => item.preset)
      .filter((preset): preset is string => !!preset),
  )
  const accent = PRIMARY_COBALT
  const promptByType: Record<string, string> = {
    work: 'What are you working on?',
    study: 'What are you studying?',
    exercise: 'What are you doing?',
    leisure: 'How are you spending this leisure time?',
    everyday: 'What are you taking care of?',
    rest: 'How are you spending this time?',
    social: 'Who are you spending time with?',
    creative: 'What are you making?',
    other: 'What are you doing?',
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: RECORD_BG, padding: '60px 32px 48px' }} className="session-setup-atmosphere animate-fade-in">
      <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: TEXT3, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 48, padding: 0 }}>
        ← back
      </button>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 500 }}>{type.name}</p>
        <h2 style={{ fontSize: 26, fontWeight: 500, color: TEXT, marginBottom: 8, lineHeight: 1.35, letterSpacing: '-0.015em' }}>
          {promptByType[typeId] || `How are you spending this ${type.name.toLowerCase()} time?`}
        </h2>
        <p style={{ fontSize: 14, color: TEXT3, marginBottom: 48 }}>{type.description}</p>

        <>
            <textarea
              autoFocus
              placeholder="Optional — describe this session"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', borderBottom: `1px solid ${BORDER}`,
                padding: '12px 0', fontSize: 16, color: TEXT,
                outline: 'none', fontFamily: 'inherit', resize: 'none',
                lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 12,
              }}
            />
            <div className="preset-chip-row">
              {type.presets.map(preset => (
                <button
                  key={preset}
                  className={desc === preset ? 'is-selected' : ''}
                  onClick={() => setDesc(preset)}
                >
                  {preset}{directedPresets.has(preset) && <span className="direction-preset-mark"> · Direction</span>}
                </button>
              ))}
              <button className="add-preset-chip" onClick={() => setShowAddPreset(true)}>＋ Add preset</button>
            </div>
            {showAddPreset && (
              <div className="inline-preset-creator animate-fade-in">
                <label htmlFor="new-preset-name">Preset name</label>
                <input
                  id="new-preset-name"
                  autoFocus
                  value={newPresetName}
                  onChange={event => setNewPresetName(event.target.value)}
                  placeholder="e.g. Meal prep"
                  onKeyDown={event => {
                    if (event.key === 'Enter' && newPresetName.trim()) {
                      const preset = newPresetName.trim()
                      onAddPreset(typeId, preset)
                      setDesc(preset)
                      setNewPresetName('')
                      setShowAddPreset(false)
                    }
                  }}
                />
                <div>
                  <button onClick={() => { setShowAddPreset(false); setNewPresetName('') }}>Cancel</button>
                  <button
                    disabled={!newPresetName.trim()}
                    onClick={() => {
                      const preset = newPresetName.trim()
                      onAddPreset(typeId, preset)
                      setDesc(preset)
                      setNewPresetName('')
                      setShowAddPreset(false)
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => setFocusEnabled(v => !v)}
              className="setup-option-row"
            >
              <span className={`circle-choice ${focusEnabled ? 'is-selected' : ''}`}>
                <svg width={11} height={8} viewBox="0 0 11 8"><path d="M1 4L4 7L10 1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: 14, color: TEXT }}>Focus</span>
                <span style={{ display: 'block', fontSize: 12, color: TEXT2, marginTop: 3 }}>Mark this time as a Focused period</span>
              </span>
            </button>
            <button onClick={() => setNudgeEnabled(v => !v)} className="setup-option-row">
              <span className={`circle-choice ${nudgeEnabled ? 'is-selected' : ''}`}>
                <svg width={11} height={8} viewBox="0 0 11 8"><path d="M1 4L4 7L10 1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: 14, color: TEXT }}>Nudge me</span>
                <span style={{ display: 'block', fontSize: 12, color: TEXT2, marginTop: 3 }}>A gentle reminder while this session is active</span>
              </span>
            </button>
            <div className={`nudge-options ${nudgeEnabled ? 'is-visible' : ''}`}>
              {['Off', '60m', '90m', '2h'].map(option => (
                <button key={option} className={`nudge-chip ${reminder === option ? 'is-selected' : ''}`} onClick={() => setReminder(option)}>{option}</button>
              ))}
              <button className={`nudge-chip ${reminder.startsWith('custom') ? 'is-selected' : ''}`} onClick={() => setShowCustomNudge(true)}>
                {reminder.startsWith('custom') ? `${customMinutes}m` : 'Custom'}
              </button>
            </div>
        </>
      </div>

      <button
        onClick={() => onStart(desc, focusEnabled, nudgeEnabled && reminder !== 'Off' ? reminder : '')}
        style={{
          width: '100%', padding: '17px',
          background: accent, color: WHITE,
          border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'opacity 0.15s, transform 0.15s',
          letterSpacing: '0.01em',
        }}
        onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
        onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Start
      </button>
      {showCustomNudge && (
        <div className="modal-veil" onClick={() => setShowCustomNudge(false)}>
          <div className="custom-nudge-sheet" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.11em', textTransform: 'uppercase', marginBottom: 24 }}>Custom reminder</p>
            <div className="custom-time-stepper">
              <button onClick={() => setCustomMinutes(value => Math.max(15, value - 15))}>−</button>
              <span>{Math.floor(customMinutes / 60) > 0 ? `${Math.floor(customMinutes / 60)}h ` : ''}{customMinutes % 60 ? `${customMinutes % 60}m` : ''}</span>
              <button onClick={() => setCustomMinutes(value => Math.min(360, value + 15))}>+</button>
            </div>
            <button className="confirm-primary" onClick={() => { setReminder(`custom-${customMinutes}m`); setShowCustomNudge(false) }}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
