import { useState } from 'react'
import { BORDER, TEXT, TEXT2, TEXT3 } from '../ui/tokens'
import { MAX_CONTACT_LENGTH, MAX_MESSAGE_LENGTH } from '../domain/telemetry'
import type { Settings } from '../domain/types'

const NUDGE_OPTIONS = [['off', 'Off'], ['60', '60m'], ['90', '90m'], ['120', '2h']]

export function SettingsSheet({ settings, onChange, onSendFeedback, onClose }: {
  settings: Settings
  onChange: (updates: Partial<Settings>) => void
  onSendFeedback: (message: string, contact: string) => Promise<boolean>
  onClose: () => void
}) {
  const [view, setView] = useState<'main' | 'feedback'>('main')
  const [showCustom, setShowCustom] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(settings.customNudgeMinutes)
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const { nudgeAfter } = settings

  const send = async () => {
    setSendState('sending')
    const ok = await onSendFeedback(message.trim(), contact.trim())
    setSendState(ok ? 'sent' : 'failed')
    if (ok) setMessage('')
  }

  // A tap outside the sheet closes it — except while a feedback message is being written, where
  // the same tap (often meant to dismiss the keyboard) would throw the message away.
  const closeFromVeil = () => {
    if (view === 'feedback' && message.trim()) return
    onClose()
  }

  return (
    <div className="modal-veil" onClick={closeFromVeil}>
      {view === 'main' && (
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
          <button
            className="setup-option-row"
            role="switch"
            aria-checked={settings.shareUsage}
            onClick={() => onChange({ shareUsage: !settings.shareUsage })}
          >
            <span className={`circle-choice ${settings.shareUsage ? 'is-selected' : ''}`}>
              <svg width={11} height={8} viewBox="0 0 11 8"><path d="M1 4L4 7L10 1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 14, color: TEXT }}>Share anonymous usage</span>
              <span style={{ display: 'block', fontSize: 12, color: TEXT2, marginTop: 3 }}>Counts and durations only — never what you write</span>
            </span>
          </button>
          <p style={{ fontSize: 12, color: TEXT3, lineHeight: 1.55, marginTop: 14, marginBottom: 24 }}>Rest, leisure, and unstructured time are all valid parts of a day.</p>
          <button className="confirm-primary" onClick={onClose}>Done</button>
          <button className="confirm-secondary" onClick={() => { setSendState('idle'); setView('feedback') }}>Send feedback</button>
        </div>
      )}

      {view === 'feedback' && (
        <div className="end-confirm animate-fade-in" onClick={e => e.stopPropagation()}>
          <button className="sheet-back" onClick={() => setView('main')}>← Settings</button>
          <p style={{ fontSize: 22, fontWeight: 500, color: TEXT, marginBottom: 6 }}>Send feedback</p>
          {sendState === 'sent' ? (
            <>
              <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6, marginBottom: 24 }}>Sent. Thank you for taking the time.</p>
              <button className="confirm-primary" onClick={() => setView('main')}>Done</button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.55, marginBottom: 12 }}>What works, what doesn&apos;t, what&apos;s missing — it goes straight to the person building TimeBox.</p>
              <textarea
                autoFocus
                className="create-type-input"
                aria-label="Your feedback"
                rows={4}
                maxLength={MAX_MESSAGE_LENGTH}
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="Your feedback"
              />
              <input
                className="create-type-input"
                aria-label="Email for a reply (optional)"
                maxLength={MAX_CONTACT_LENGTH}
                value={contact}
                onChange={event => setContact(event.target.value)}
                placeholder="Email, if you'd like a reply (optional)"
              />
              {sendState === 'failed' && (
                <p role="status" style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, marginTop: 12 }}>That didn&apos;t go through — you may be offline. Your message is still here.</p>
              )}
              <button
                className="confirm-primary"
                style={{ marginTop: 20, opacity: message.trim() && sendState !== 'sending' ? 1 : 0.42 }}
                disabled={!message.trim() || sendState === 'sending'}
                onClick={send}
              >
                {sendState === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </div>
      )}

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
