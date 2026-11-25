import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CategoryIcon } from '../ui/CategoryIcon'
import { TEXT, TEXT2, TEXT3 } from '../ui/tokens'
import { ICON_OPTIONS, MAX_SESSION_TYPES, presetsFor } from '../domain/defaults'
import { formatDuration, formatRecordedTotal, formatSinceStart } from '../domain/format'
import { sessionDuration, sumSessionMs } from '../domain/time'
import type { Direction, Session, SessionType } from '../domain/types'
import type { NewSessionType } from '../data/store'
import { useNow } from '../hooks/useNow'

// ─── DirectionBlock wrapper — correct flowing border ──────────────────────────
//
// The card and its border geometry are completely stationary.
// .direction-border-ring (defined in index.css) sits absolutely at -2px inset,
// with a conic gradient that rotates via CSS @property --flow-angle.
// The mask-composite: exclude punch makes only the 2px ring visible.
// Nothing rotates as an object behind the card.

function DirectionBlockWrap({ children }: { children: ReactNode }) {
  return (
    <div className="session-row-direction-shell">
      {/* Stationary flowing border ring — see .direction-border-ring in index.css */}
      <div className="direction-border-ring" />
      <div className="session-row-direction-content">{children}</div>
    </div>
  )
}

// ─── SessionBlock ─────────────────────────────────────────────────────────────

function CategoryMenuButton({ categoryName, onOpen }: { categoryName: string; onOpen: () => void }) {
  return (
    <button
      className="category-menu-trigger"
      aria-label={`Open ${categoryName} settings`}
      onPointerDown={event => event.stopPropagation()}
      onClick={event => {
        event.stopPropagation()
        onOpen()
      }}
    >
      <span /><span /><span />
    </button>
  )
}

function SessionBlock({ type, hasDirection, durationMs, fillRatio, onActivate, onOpenSettings }: {
  type: SessionType; hasDirection: boolean; durationMs: number; fillRatio: number
  onActivate: () => void; onOpenSettings: () => void
}) {
  const inner = (
    <div
      onClick={onActivate}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate()
        }
      }}
      role="button"
      tabIndex={0}
      className="session-row"
      onPointerDown={event => { event.currentTarget.style.transform = 'scale(0.985)' }}
      onPointerUp={event => { event.currentTarget.style.transform = 'scale(1)' }}
      onPointerLeave={event => { event.currentTarget.style.transform = 'scale(1)' }}
    >
      <CategoryMenuButton categoryName={type.name} onOpen={onOpenSettings} />
      <div className="session-row-layout">
        <span className="category-icon"><CategoryIcon id={type.iconId || type.id} /></span>
        <div className="session-row-copy">
          <div className="session-row-title">{type.name}</div>
          <div className="session-row-time-line">
            {durationMs > 0 && <span className="session-row-duration">{formatDuration(durationMs)}</span>}
            <div className="liquid-time-track" aria-hidden="true">
              {durationMs > 0 && (
                <span
                  className="liquid-time-fill"
                  style={{
                    width: `${Math.min(Math.max(fillRatio * 100, 0), 100)}%`,
                    minWidth: 8,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (hasDirection) {
    return <DirectionBlockWrap>{inner}</DirectionBlockWrap>
  }
  return inner
}

function EndTodayAction({ onClick }: { onClick: () => void }) {
  return (
    <button className="record-end-today" onClick={onClick}>
      <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
        <line x1={6} y1={1} x2={6} y2={9} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        <path d="M3 7 L6 10 L9 7" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>End Today</span>
    </button>
  )
}

function RecordEdgeNavigation({ onDirection, onSessions, onStats, showSessions = true }: {
  onDirection: () => void; onSessions: () => void; onStats: () => void; showSessions?: boolean
}) {
  return (
    <nav className="record-edge-navigation" aria-label="Record navigation">
      <button className="is-direction" onClick={onDirection}>
        <span>Direction</span>
        <svg width={15} height={15} viewBox="0 0 15 15" aria-hidden="true">
          <path d="m9.2 3.7-3.7 3.8 3.7 3.8" fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showSessions && (
        <button className="is-sessions" onClick={onSessions}>
          <span>Sessions</span>
          <svg width={15} height={15} viewBox="0 0 15 15" aria-hidden="true">
            <path d="m3.7 5.8 3.8 3.2 3.8-3.2" fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <button className="is-stats" onClick={onStats}>
        <span>Stats</span>
        <svg width={15} height={15} viewBox="0 0 15 15" aria-hidden="true">
          <path d="m5.8 3.7 3.7 3.8-3.7 3.8" fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  )
}

// ─── RecordScreen ─────────────────────────────────────────────────────────────

export function RecordScreen({ sessionTypes, directions, sessions, dayStartTime, dayStarted, onStartToday, onSetDirection, onDirection, onStats, onSessionDrop, onEndToday, onUpdateType, onDeleteType, onCreateType }: {
  sessionTypes: SessionType[]; directions: Direction[]; sessions: Session[]; dayStartTime: number
  dayStarted: boolean; onStartToday: () => void; onSetDirection: () => void
  onDirection: () => void; onStats: () => void
  onSessionDrop: (typeId: string) => void; onEndToday: () => void
  onUpdateType: (typeId: string, updates: Partial<Pick<SessionType, 'name' | 'description' | 'presets' | 'iconId'>>) => void
  onDeleteType: (typeId: string) => void
  onCreateType: (type: NewSessionType) => void
}) {
  const selectionRef = useRef<HTMLElement>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)
  const [settingsTypeId, setSettingsTypeId] = useState<string | null>(null)
  const [settingsView, setSettingsView] = useState<'menu' | 'name' | 'description' | 'icon' | 'presets' | 'delete'>('menu')
  const [editValue, setEditValue] = useState('')
  const [editIconId, setEditIconId] = useState('other')
  const [presetDrafts, setPresetDrafts] = useState<string[]>([])
  const [newSessionName, setNewSessionName] = useState('')
  const [newSessionIcon, setNewSessionIcon] = useState('work')
  const [newSessionPresets, setNewSessionPresets] = useState<string[]>([])
  const [newSessionPresetName, setNewSessionPresetName] = useState('')
  const [addingSessionPreset, setAddingSessionPreset] = useState(false)
  const now = useNow()
  const currentTime = new Date(now)
  // Before Start Today nothing counts as "today" yet.
  const since = dayStarted ? dayStartTime : now

  const directionMap = Object.fromEntries(directions.map(d => [d.typeId, d]))
  const allTypes = sessionTypes
  const canAddSession = allTypes.length < MAX_SESSION_TYPES
  const completedToday = sessions
    .filter(session => session.startTime >= since)
  const recordedToday = completedToday
    .reduce((total, session) => total + sessionDuration(session), 0)

  const handleStartFromOverview = () => {
    onStartToday()
    window.setTimeout(() => {
      selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const settingsType = settingsTypeId ? allTypes.find(type => type.id === settingsTypeId) || null : null
  return (
    <div className="record-atmosphere record-scroll">
      <section className="record-overview-section" aria-label="Today overview">
        <div className="record-overview-heading">
          <p className="record-overview-label">Your time</p>
          <p className="record-current-date">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="current-clock">{currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
          {dayStarted && (
            <p className="record-since-start">
              {formatSinceStart(now - dayStartTime)} since start
            </p>
          )}
          <div className="record-daily-summary" key={`${completedToday.length}-${recordedToday}`}>
            <span>{completedToday.length} {completedToday.length === 1 ? 'recording' : 'recordings'}</span>
            <span>{formatRecordedTotal(recordedToday)} recorded</span>
          </div>
        </div>

        <div className="overview-blob-stage" aria-hidden="true">
          <div className="overview-time-blob time-blob time-blob-resting">
            <span className="time-blob-layer time-blob-flow-layer" />
            <span className="time-blob-layer time-blob-depth-layer" />
            <span className="time-blob-layer time-blob-light-layer" />
          </div>
        </div>

        <div className={`record-first-entry-actions${dayStarted ? ' is-hidden' : ''}`} aria-hidden={dayStarted}>
          <button className="record-start-today" disabled={dayStarted} tabIndex={dayStarted ? -1 : 0} onClick={handleStartFromOverview}>
            Start Today
          </button>
          <button className="record-set-direction" disabled={dayStarted} tabIndex={dayStarted ? -1 : 0} onClick={onSetDirection}>
            Set Today&apos;s Direction
          </button>
        </div>

        <footer className="record-page-footer">
          <RecordEdgeNavigation
            onDirection={onDirection}
            onSessions={() => selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            onStats={onStats}
          />
          {dayStarted && <EndTodayAction onClick={() => setShowEndConfirm(true)} />}
        </footer>
      </section>

      <section ref={selectionRef} className="record-selection-section" aria-label="Session selection">
        <div className="session-row-list">
          {allTypes.map(type => {
            const hasDir = !!directionMap[type.id]
            const durationMs = sumSessionMs(sessions, type.id, since)

            return (
              <div key={type.id}>
                <SessionBlock
                  type={type}
                  hasDirection={hasDir}
                  durationMs={durationMs}
                  fillRatio={recordedToday > 0 ? durationMs / recordedToday : 0}
                  onActivate={() => onSessionDrop(type.id)}
                  onOpenSettings={() => {
                    setSettingsTypeId(type.id)
                    setSettingsView('menu')
                  }}
                />
              </div>
            )
          })}
          {canAddSession && (
            <button className="add-session-card" onClick={() => setShowAddSession(true)}>
              <span>＋</span>
              <strong>Add category</strong>
            </button>
          )}
        </div>
        <footer className="record-page-footer">
          <RecordEdgeNavigation
            onDirection={onDirection}
            onSessions={() => selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            onStats={onStats}
            showSessions={false}
          />
          {dayStarted && <EndTodayAction onClick={() => setShowEndConfirm(true)} />}
        </footer>
      </section>

      {showAddSession && (
        <div className="modal-veil" onClick={() => setShowAddSession(false)}>
          <div className="end-confirm animate-fade-in add-session-sheet" onClick={event => event.stopPropagation()}>
            <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>New category</p>
            <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em', marginBottom: 20 }}>Add category</p>

            <label className="sheet-field-label" htmlFor="new-session-name">Category name</label>
            <input
              id="new-session-name"
              autoFocus
              className="create-type-input"
              value={newSessionName}
              onChange={event => setNewSessionName(event.target.value)}
              placeholder="Reading"
            />

            <p className="sheet-field-label">Icon</p>
            <div className="icon-selection-grid">
              {ICON_OPTIONS.map(iconId => (
                <button
                  key={iconId}
                  className={newSessionIcon === iconId ? 'is-selected' : ''}
                  onClick={() => setNewSessionIcon(iconId)}
                  aria-label={`Choose ${iconId} icon`}
                >
                  <CategoryIcon id={iconId} />
                </button>
              ))}
            </div>

            <p className="sheet-field-label">Preset activities</p>
            <div className="creation-preset-list">
              {newSessionPresets.map((preset, index) => (
                <div key={index}>
                  <input
                    value={preset}
                    onChange={event => setNewSessionPresets(items => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    aria-label={`New category preset ${index + 1}`}
                  />
                  <button onClick={() => setNewSessionPresets(items => items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                </div>
              ))}
            </div>
            {addingSessionPreset ? (
              <div className="creation-preset-add">
                <input
                  autoFocus
                  value={newSessionPresetName}
                  onChange={event => setNewSessionPresetName(event.target.value)}
                  placeholder="Preset name"
                />
                <button onClick={() => { setAddingSessionPreset(false); setNewSessionPresetName('') }}>Cancel</button>
                <button
                  disabled={!newSessionPresetName.trim()}
                  onClick={() => {
                    setNewSessionPresets(items => [...items, newSessionPresetName.trim()])
                    setNewSessionPresetName('')
                    setAddingSessionPreset(false)
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button className="add-preset-button" onClick={() => setAddingSessionPreset(true)}>＋ Add preset</button>
            )}

            <button
              className="confirm-primary"
              style={{ marginTop: 18, opacity: newSessionName.trim() && newSessionIcon ? 1 : 0.42 }}
              disabled={!newSessionName.trim() || !newSessionIcon}
              onClick={() => {
                onCreateType({
                  name: newSessionName.trim(),
                  description: 'Custom category',
                  iconId: newSessionIcon,
                  presets: newSessionPresets.map(item => item.trim()).filter(Boolean),
                })
                setShowAddSession(false)
                setNewSessionName('')
                setNewSessionIcon('work')
                setNewSessionPresets([])
                setNewSessionPresetName('')
                setAddingSessionPreset(false)
              }}
            >
              Create category
            </button>
            <button className="confirm-secondary" onClick={() => setShowAddSession(false)}>Cancel</button>
          </div>
        </div>
      )}

      {settingsType && (
        <div className="modal-veil" onClick={() => setSettingsTypeId(null)}>
          <div className="end-confirm animate-fade-in category-settings-sheet" onClick={event => event.stopPropagation()}>
            {settingsView === 'menu' && (
              <>
                <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Category settings</p>
                <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em', marginBottom: 18 }}>{settingsType.name}</p>
                <div className="category-settings-list">
                  <button onClick={() => { setEditValue(settingsType.name); setSettingsView('name') }}>Edit name</button>
                  <button onClick={() => { setEditValue(settingsType.description); setSettingsView('description') }}>Edit description</button>
                  <button onClick={() => { setEditIconId(settingsType.iconId || settingsType.id); setSettingsView('icon') }}>Change icon</button>
                  <button onClick={() => {
                    setPresetDrafts([...presetsFor(settingsType)])
                    setSettingsView('presets')
                  }}>Manage presets</button>
                  <button className="is-destructive" onClick={() => setSettingsView('delete')}>Delete category</button>
                </div>
                <button className="confirm-secondary" onClick={() => setSettingsTypeId(null)}>Close</button>
              </>
            )}

            {(settingsView === 'name' || settingsView === 'description') && (
              <>
                <button className="sheet-back" onClick={() => setSettingsView('menu')}>← Category settings</button>
                <p style={{ fontSize: 22, fontWeight: 500, color: TEXT, marginBottom: 18 }}>
                  Edit {settingsView === 'name' ? 'name' : 'description'}
                </p>
                {settingsView === 'name' ? (
                  <input autoFocus className="create-type-input" value={editValue} onChange={event => setEditValue(event.target.value)} />
                ) : (
                  <textarea autoFocus className="create-type-input" rows={3} value={editValue} onChange={event => setEditValue(event.target.value)} />
                )}
                <button
                  className="confirm-primary"
                  style={{ marginTop: 22, opacity: editValue.trim() ? 1 : 0.42 }}
                  disabled={!editValue.trim()}
                  onClick={() => {
                    onUpdateType(settingsType.id, { [settingsView]: editValue.trim() })
                    setSettingsView('menu')
                  }}
                >
                  Save
                </button>
              </>
            )}

            {settingsView === 'icon' && (
              <>
                <button className="sheet-back" onClick={() => setSettingsView('menu')}>← Category settings</button>
                <p style={{ fontSize: 22, fontWeight: 500, color: TEXT, marginBottom: 16 }}>Choose an icon</p>
                <div className="icon-selection-grid">
                  {ICON_OPTIONS.map(iconId => (
                    <button
                      key={iconId}
                      className={editIconId === iconId ? 'is-selected' : ''}
                      onClick={() => setEditIconId(iconId)}
                      aria-label={`Choose ${iconId} icon`}
                    >
                      <CategoryIcon id={iconId} />
                    </button>
                  ))}
                </div>
                <button
                  className="confirm-primary"
                  style={{ marginTop: 20 }}
                  onClick={() => {
                    onUpdateType(settingsType.id, { iconId: editIconId })
                    setSettingsView('menu')
                  }}
                >
                  Save
                </button>
              </>
            )}

            {settingsView === 'presets' && (
              <>
                <button className="sheet-back" onClick={() => setSettingsView('menu')}>← Category settings</button>
                <p style={{ fontSize: 22, fontWeight: 500, color: TEXT, marginBottom: 6 }}>Manage {settingsType.name} presets</p>
                <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, marginBottom: 16 }}>Rename, reorder, or remove quick activity labels.</p>
                <div className="preset-manager-list">
                  {presetDrafts.map((preset, index) => (
                    <div key={index}>
                      <input
                        value={preset}
                        onChange={event => setPresetDrafts(items => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                        aria-label={`Preset ${index + 1}`}
                      />
                      <button disabled={index === 0} onClick={() => setPresetDrafts(items => {
                        const next = [...items]
                        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                        return next
                      })}>↑</button>
                      <button disabled={index === presetDrafts.length - 1} onClick={() => setPresetDrafts(items => {
                        const next = [...items]
                        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                        return next
                      })}>↓</button>
                      <button aria-label={`Delete ${preset}`} onClick={() => setPresetDrafts(items => items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                    </div>
                  ))}
                </div>
                <button className="add-preset-button" onClick={() => setPresetDrafts(items => [...items, 'New preset'])}>＋ Add preset</button>
                <button
                  className="confirm-primary"
                  style={{ marginTop: 18 }}
                  onClick={() => {
                    onUpdateType(settingsType.id, { presets: presetDrafts.map(item => item.trim()).filter(Boolean) })
                    setSettingsView('menu')
                  }}
                >
                  Save
                </button>
              </>
            )}

            {settingsView === 'delete' && (
              <>
                <p style={{ fontSize: 12, color: '#B55454', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Delete category</p>
                <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em', marginBottom: 8 }}>Delete {settingsType.name}?</p>
                <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.55, marginBottom: 24 }}>Past records keep the category name they were recorded under.</p>
                <button className="delete-category-confirm" onClick={() => { onDeleteType(settingsType.id); setSettingsTypeId(null) }}>Delete category</button>
                <button className="confirm-secondary" onClick={() => setSettingsView('menu')}>Not yet</button>
              </>
            )}
          </div>
        </div>
      )}

      {showEndConfirm && (
        <div className="modal-veil" onClick={() => setShowEndConfirm(false)}>
          <div className="end-confirm animate-fade-in" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 12, color: TEXT3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>End Today</p>
            <p style={{ fontSize: 24, fontWeight: 500, color: TEXT, letterSpacing: '-0.02em', marginBottom: 8 }}>Close today's record?</p>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: TEXT2, marginBottom: 28 }}>Your timeline will stop here and open a quiet reflection.</p>
            <button className="confirm-primary" onClick={onEndToday}>End Today</button>
            <button className="confirm-secondary" onClick={() => setShowEndConfirm(false)}>Not yet</button>
          </div>
        </div>
      )}
    </div>
  )
}
