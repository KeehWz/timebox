import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useAppState, useStorageFailed } from './data/useAppState'
import * as store from './data/store'
import type { Session } from './domain/types'
import { WHITE } from './ui/tokens'
import { RecordScreen } from './screens/RecordScreen'
import { SessionSetupScreen } from './screens/SessionSetupScreen'
import { ActiveSessionScreen } from './screens/ActiveSessionScreen'
import { SessionEndScreen } from './screens/SessionEndScreen'
import { DirectionScreen } from './screens/DirectionScreen'
import { StatsScreen } from './screens/StatsScreen'
import { EndDayReflectionScreen } from './screens/EndDayReflectionScreen'
import { SettingsSheet } from './screens/SettingsSheet'
import { StorageUnavailable } from './screens/StorageUnavailable'

type View = 'record' | 'session-setup' | 'session-end' | 'direction' | 'stats'
type Screen = View | 'active' | 'end-day-reflection'

const PAGES: Screen[] = ['direction', 'record', 'stats']

/** Fire a store write; the live query re-renders the UI when it lands. */
function run(write: Promise<unknown>) {
  write.catch(error => console.error('[timebox] store write failed', error))
}

export default function App() {
  const state = useAppState()
  const storageFailed = useStorageFailed()
  const [view, setView] = useState<View>('record')
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [lastSession, setLastSession] = useState<Session | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const pageSwipeStart = useRef<{ x: number; y: number } | null>(null)

  // A day that was never ended is closed quietly when the app is next opened after 4am.
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') run(store.closeStaleDay(Date.now()))
    }
    check()
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [])

  // A running session and an unfinished reflection survive reloads, so they win over `view`.
  const screen: Screen = state?.active ? 'active' : state?.day.endTime ? 'end-day-reflection' : view

  const handleSessionEnd = async () => {
    setLastSession(null)
    setView('session-end')
    const finished = await store.endSession(Date.now())
    if (finished) setLastSession(finished)
    else setView('record')
    // The stale-day check is skipped while a session runs, so repeat it once the session is over.
    await store.closeStaleDay(Date.now())
  }

  const handlePageSwipeStart = (event: ReactPointerEvent) => {
    if (!PAGES.includes(screen)) return
    pageSwipeStart.current = { x: event.clientX, y: event.clientY }
  }

  const handlePageSwipeEnd = (event: ReactPointerEvent) => {
    const start = pageSwipeStart.current
    pageSwipeStart.current = null
    if (!start || !PAGES.includes(screen)) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return
    if (deltaX < 0) {
      if (screen === 'direction') setView('record')
      else if (screen === 'record') setView('stats')
    } else {
      if (screen === 'stats') setView('record')
      else if (screen === 'record') setView('direction')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100dvh', background: '#E9EBEF' }}>
      <div style={{
        width: '100%', maxWidth: 430, minHeight: '100dvh',
        background: WHITE, position: 'relative', overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 20px 80px rgba(0,0,0,0.10)',
      }}>
        {state && state.day.started && PAGES.includes(screen) && (
          <button className="settings-trigger" onClick={() => setShowSettings(true)} aria-label="Open settings">
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M19 13.2v-2.4l-2-.6a7 7 0 0 0-.7-1.6l1-1.9-1.7-1.7-1.9 1a7 7 0 0 0-1.6-.7L11.5 3H9.1l-.6 2.1a7 7 0 0 0-1.6.7L5 4.8 3.3 6.5l1 1.9a7 7 0 0 0-.7 1.6l-2 .6V13l2 .6a7 7 0 0 0 .7 1.6l-1 1.9L5 18.8l1.9-1a7 7 0 0 0 1.6.7l.6 2.1h2.4l.6-2.1a7 7 0 0 0 1.6-.7l1.9 1 1.7-1.7-1-1.9a7 7 0 0 0 .7-1.6l2-.4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {!state && storageFailed && <StorageUnavailable />}

        {state && (
          <div
            style={{ height: '100dvh', boxSizing: 'border-box' }}
            onPointerDown={handlePageSwipeStart}
            onPointerUp={handlePageSwipeEnd}
            onPointerCancel={() => { pageSwipeStart.current = null }}
          >
            {screen === 'record' && (
              <RecordScreen
                sessionTypes={state.sessionTypes} directions={state.directions}
                sessions={state.sessions} dayStartTime={state.day.startTime}
                dayStarted={state.day.started}
                onStartToday={() => run(store.startDay(Date.now()))}
                onSetDirection={() => { run(store.startDay(Date.now())); setView('direction') }}
                onDirection={() => setView('direction')}
                onStats={() => setView('stats')}
                onSessionDrop={typeId => { setSelectedTypeId(typeId); setView('session-setup') }}
                onEndToday={() => run(store.markDayEnd(Date.now()))}
                onUpdateType={(typeId, updates) => run(store.updateType(typeId, updates))}
                onDeleteType={typeId => run(store.deleteType(typeId))}
                onCreateType={type => run(store.createType(type))}
              />
            )}
            {screen === 'session-setup' && (
              <SessionSetupScreen
                typeId={selectedTypeId}
                sessionTypes={state.sessionTypes}
                directions={state.directions}
                onStart={(description, focusEnabled, reminder) =>
                  run(store.startSession({ typeId: selectedTypeId, description, focusEnabled, reminder }, Date.now()))}
                onBack={() => setView('record')}
                onAddPreset={(typeId, preset) => run(store.addPreset(typeId, preset))}
              />
            )}
            {screen === 'active' && state.active && (
              <ActiveSessionScreen
                active={state.active} sessions={state.sessions} dayStartTime={state.day.startTime}
                onPause={() => run(store.pauseSession(Date.now()))}
                onResume={() => run(store.resumeSession(Date.now()))}
                onEnd={() => run(handleSessionEnd())}
              />
            )}
            {screen === 'session-end' && lastSession && (
              <SessionEndScreen session={lastSession} onContinue={description => {
                run(store.updateSessionDescription(lastSession.id, description))
                setView('record')
              }} />
            )}
            {screen === 'direction' && (
              <DirectionScreen
                sessionTypes={state.sessionTypes}
                directions={state.directions}
                onUpdate={directions => run(store.setDirections(directions))}
                onRecord={() => setView('record')}
              />
            )}
            {screen === 'stats' && (
              <StatsScreen
                sessions={state.sessions}
                sessionTypes={state.sessionTypes}
                onRecord={() => setView('record')}
                onEditSession={(sessionId, description) => run(store.updateSessionDescription(sessionId, description))}
              />
            )}
            {screen === 'end-day-reflection' && (
              <EndDayReflectionScreen
                sessions={state.sessions} directions={state.directions}
                dayStartTime={state.day.startTime} dayEndTime={state.day.endTime}
                sessionTypes={state.sessionTypes}
                onDone={reflection => { run(store.closeDay(reflection, Date.now())); setView('record') }}
              />
            )}
          </div>
        )}
        {state && showSettings && (
          <SettingsSheet
            settings={state.settings}
            onChange={updates => run(store.updateSettings(updates))}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  )
}
