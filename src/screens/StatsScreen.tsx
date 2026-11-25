import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { colorWithAlpha, formatClock, formatRecordedTotal } from '../domain/format'
import { buildCategoryBreakdown, categoryColor, type StatsCategory } from '../domain/stats'
import { addCalendarDays, localDateKey, sessionDuration, startOfCalendarWeek, startOfDate } from '../domain/time'
import type { Session, SessionType } from '../domain/types'
import { useNow } from '../hooks/useNow'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function StatsScreen({ sessions, sessionTypes, onRecord, onEditSession }: {
  sessions: Session[]
  sessionTypes: SessionType[]
  onRecord: () => void
  onEditSession: (sessionId: string, description: string) => void
}) {
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily')
  const [selectedDate, setSelectedDate] = useState(() => startOfDate(new Date()))
  const [selectedWeek, setSelectedWeek] = useState(() => startOfCalendarWeek(new Date()))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showAllCategory, setShowAllCategory] = useState<string | null>(null)
  const [matrixDetail, setMatrixDetail] = useState<{ typeId: string; dayIndex: number } | null>(null)
  const rangeSwipeStart = useRef<{ x: number; y: number } | null>(null)
  const now = useNow(60_000) // only used to tell whether the selected range is the current one

  const dayStart = selectedDate.getTime()
  const dayEnd = addCalendarDays(selectedDate, 1).getTime()
  const dailySessions = sessions
    .filter(session => session.startTime >= dayStart && session.startTime < dayEnd)
    .sort((a, b) => a.startTime - b.startTime)
  const dailyCategories = buildCategoryBreakdown(dailySessions)
  const dailyTotal = dailyCategories.reduce((total, category) => total + category.duration, 0)

  const weekStart = selectedWeek.getTime()
  const weekEnd = addCalendarDays(selectedWeek, 7).getTime()
  const weeklySessions = sessions
    .filter(session => session.startTime >= weekStart && session.startTime < weekEnd)
    .sort((a, b) => a.startTime - b.startTime)
  const recordedWeeklyCategories = buildCategoryBreakdown(weeklySessions)
  const currentCategoryIds = new Set(sessionTypes.map(type => type.id))
  const weeklyCategories = [
    ...sessionTypes.map(type => {
      const recorded = recordedWeeklyCategories.find(category => category.typeId === type.id)
      return recorded
        ? { ...recorded, name: type.name }
        : { typeId: type.id, name: type.name, duration: 0, activities: [] }
    }),
    ...recordedWeeklyCategories.filter(category => !currentCategoryIds.has(category.typeId)),
  ]
  const weeklyTotal = weeklyCategories.reduce((total, category) => total + category.duration, 0)
  const selectedSession = dailySessions.find(session => session.id === selectedSessionId) || null
  const isToday = localDateKey(selectedDate) === localDateKey(new Date(now))
  const isCurrentWeek = localDateKey(selectedWeek) === localDateKey(startOfCalendarWeek(new Date(now)))

  const moveRange = (amount: number) => {
    setExpandedCategory(null)
    setShowAllCategory(null)
    setSelectedSessionId(null)
    setMatrixDetail(null)
    if (mode === 'daily') setSelectedDate(date => addCalendarDays(date, amount))
    else setSelectedWeek(week => addCalendarDays(week, amount * 7))
  }

  const handleRangePointerDown = (event: ReactPointerEvent) => {
    event.stopPropagation()
    rangeSwipeStart.current = { x: event.clientX, y: event.clientY }
  }

  const handleRangePointerUp = (event: ReactPointerEvent) => {
    event.stopPropagation()
    const start = rangeSwipeStart.current
    rangeSwipeStart.current = null
    if (!start) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) moveRange(deltaX < 0 ? 1 : -1)
  }

  const saveSessionDescription = () => {
    if (!editingSessionId) return
    onEditSession(editingSessionId, editDescription.trim())
    setEditingSessionId(null)
  }

  const renderCategoryRows = (categories: StatsCategory[], total: number, weekly = false) => (
    <div className="stats-category-list">
      {categories.map(category => {
        const hasActivity = category.duration > 0
        const isExpanded = hasActivity && expandedCategory === category.typeId
        const visibleActivities = showAllCategory === category.typeId
          ? category.activities
          : category.activities.slice(0, weekly ? 4 : 3)
        const percentage = total > 0 ? (category.duration / total) * 100 : 0
        const color = categoryColor(category.typeId, sessionTypes)
        const rowContent = (
          <>
            {hasActivity
              ? <span className="stats-category-dot" style={{ background: color }} />
              : <span className="stats-category-dot-placeholder" />}
            <span className="stats-category-name">{category.name}</span>
            <span className="stats-category-value">
              {formatRecordedTotal(category.duration)}
              {weekly && hasActivity && <small>{Math.round(percentage)}%</small>}
            </span>
            {hasActivity
              ? (
                <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
                  <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )
              : <span />}
          </>
        )
        return (
          <div className={`stats-category-group${isExpanded ? ' is-expanded' : ''}${hasActivity ? '' : ' is-unused'}`} key={category.typeId}>
            {hasActivity ? (
              <button
                className="stats-category-row"
                onClick={() => {
                  setExpandedCategory(isExpanded ? null : category.typeId)
                  if (isExpanded) setShowAllCategory(null)
                }}
                aria-expanded={isExpanded}
              >
                {rowContent}
              </button>
            ) : (
              <div className="stats-category-row">
                {rowContent}
              </div>
            )}
            {weekly && hasActivity && (
              <div className="stats-composition-track" aria-hidden="true">
                <span style={{ width: `${percentage}%`, background: color }} />
              </div>
            )}
            {isExpanded && (
              <div className="stats-activity-list">
                {visibleActivities.map(activity => (
                  <div className="stats-activity-row" key={activity.name}>
                    <span>{activity.name}</span>
                    <span>{formatRecordedTotal(activity.duration)} · {Math.round((activity.duration / total) * 100)}%</span>
                  </div>
                ))}
                {category.activities.length > (weekly ? 4 : 3) && (
                  <button
                    className="stats-show-all"
                    onClick={() => setShowAllCategory(showAllCategory === category.typeId ? null : category.typeId)}
                  >
                    {showAllCategory === category.typeId ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const timeline = (() => {
    if (dailySessions.length === 0) return null
    const firstStart = dailySessions[0].startTime
    const lastEnd = Math.max(...dailySessions.map(session => session.endTime))
    const rangeStart = new Date(firstStart)
    rangeStart.setMinutes(0, 0, 0)
    const rangeEnd = new Date(lastEnd)
    rangeEnd.setMinutes(0, 0, 0)
    if (rangeEnd.getTime() < lastEnd) rangeEnd.setHours(rangeEnd.getHours() + 1)
    const rangeMinutes = Math.max(60, (rangeEnd.getTime() - rangeStart.getTime()) / 60000)
    const pixelsPerMinute = 1.12
    const height = rangeMinutes * pixelsPerMinute
    const hours = Array.from({ length: Math.floor(rangeMinutes / 60) + 1 }, (_, index) => ({
      time: rangeStart.getTime() + index * 3600000,
      top: index * 60 * pixelsPerMinute,
    }))

    return (
      <div className="stats-timeline" style={{ height }}>
        {hours.map(hour => (
          <div className="stats-hour-line" key={hour.time} style={{ top: hour.top }}>
            <span>{new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' })}</span>
            <i />
          </div>
        ))}
        <div className="stats-session-lane">
          {dailySessions.map(session => {
            const end = session.endTime
            const duration = sessionDuration(session)
            const top = ((session.startTime - rangeStart.getTime()) / 60000) * pixelsPerMinute
            const blockHeight = Math.max(22, ((end - session.startTime) / 60000) * pixelsPerMinute)
            const color = categoryColor(session.typeId, sessionTypes)
            return (
              <button
                key={session.id}
                className={`stats-session-block${selectedSessionId === session.id ? ' is-selected' : ''}`}
                style={{
                  top,
                  height: blockHeight,
                  borderColor: colorWithAlpha(color, 0.48),
                  background: `linear-gradient(110deg, ${colorWithAlpha(color, 0.2)}, ${colorWithAlpha(color, 0.09)})`,
                  color,
                }}
                onClick={() => {
                  setSelectedSessionId(selectedSessionId === session.id ? null : session.id)
                  setEditingSessionId(null)
                }}
              >
                <strong>{session.typeName}</strong>
                {blockHeight >= 42 && <span>{session.description || formatRecordedTotal(duration)}</span>}
                {blockHeight >= 68 && <small>{formatClock(session.startTime)}–{formatClock(end)} · {formatRecordedTotal(duration)}</small>}
              </button>
            )
          })}
        </div>
      </div>
    )
  })()

  const weekRangeLabel = `${selectedWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })}–${addCalendarDays(selectedWeek, 6).toLocaleDateString([], { month: 'short', day: 'numeric' })}`

  return (
    <div className="stats-page">
      <header className="stats-topbar">
        <p>Your time</p>
        <div className="stats-mode-switch" role="tablist" aria-label="Stats view">
          {(['daily', 'weekly'] as const).map(option => (
            <button
              key={option}
              role="tab"
              aria-selected={mode === option}
              className={mode === option ? 'is-active' : ''}
              onClick={() => {
                setMode(option)
                setExpandedCategory(null)
                setSelectedSessionId(null)
                setMatrixDetail(null)
              }}
            >
              {option === 'daily' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>
      </header>

      <section
        className="stats-range-header"
        onPointerDown={handleRangePointerDown}
        onPointerUp={handleRangePointerUp}
        onPointerCancel={() => { rangeSwipeStart.current = null }}
      >
        <button className="stats-range-arrow" onClick={() => moveRange(-1)} aria-label={mode === 'daily' ? 'Previous day' : 'Previous week'}>
          <svg width={16} height={16} viewBox="0 0 15 15" aria-hidden="true"><path d="m9.2 3.7-3.7 3.8 3.7 3.8" fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="stats-range-center">
          {mode === 'daily' ? (
            <>
              <button className="stats-range-title" onClick={() => setShowDatePicker(value => !value)}>
                {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </button>
              {showDatePicker && (
                <input
                  className="stats-date-picker"
                  type="date"
                  value={localDateKey(selectedDate)}
                  onChange={event => {
                    const [year, month, day] = event.target.value.split('-').map(Number)
                    if (year && month && day) setSelectedDate(new Date(year, month - 1, day))
                    setShowDatePicker(false)
                  }}
                />
              )}
            </>
          ) : <p className="stats-range-title">{weekRangeLabel}</p>}
          <p className="stats-recorded-total">{formatRecordedTotal(mode === 'daily' ? dailyTotal : weeklyTotal)} recorded</p>
        </div>
        <button className="stats-range-arrow" onClick={() => moveRange(1)} aria-label={mode === 'daily' ? 'Next day' : 'Next week'}>
          <svg width={16} height={16} viewBox="0 0 15 15" aria-hidden="true"><path d="m5.8 3.7 3.7 3.8-3.7 3.8" fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {((mode === 'daily' && !isToday) || (mode === 'weekly' && !isCurrentWeek)) && (
          <button
            className="stats-current-shortcut"
            onClick={() => mode === 'daily' ? setSelectedDate(startOfDate(new Date())) : setSelectedWeek(startOfCalendarWeek(new Date()))}
          >
            {mode === 'daily' ? 'Today' : 'This week'}
          </button>
        )}
      </section>

      {mode === 'daily' && (
        <div className="stats-view animate-fade-in">
          {dailySessions.length === 0 ? (
            <div className="stats-empty-state">
              <span />
              <p>Nothing recorded this day</p>
            </div>
          ) : (
            <>
              <section className="stats-section stats-timeline-section">
                <div className="stats-section-heading">
                  <p>Day timeline</p>
                  <span>{formatClock(dailySessions[0].startTime)}–{formatClock(Math.max(...dailySessions.map(session => session.endTime)))}</span>
                </div>
                {timeline}
              </section>

              {selectedSession && (
                <section className="stats-session-detail animate-fade-in">
                  <div className="stats-detail-color" style={{ background: categoryColor(selectedSession.typeId, sessionTypes) }} />
                  <div className="stats-detail-copy">
                    <p>{selectedSession.typeName}</p>
                    {editingSessionId === selectedSession.id ? (
                      <input autoFocus value={editDescription} onChange={event => setEditDescription(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') saveSessionDescription() }} />
                    ) : <strong>{selectedSession.description || `General ${selectedSession.typeName}`}</strong>}
                    <span>{formatClock(selectedSession.startTime)} – {formatClock(selectedSession.endTime)}</span>
                    <span>{formatRecordedTotal(sessionDuration(selectedSession))}</span>
                  </div>
                  {editingSessionId === selectedSession.id ? (
                    <button onClick={saveSessionDescription}>Save</button>
                  ) : (
                    <button onClick={() => { setEditingSessionId(selectedSession.id); setEditDescription(selectedSession.description) }}>Edit</button>
                  )}
                </section>
              )}

              <section className="stats-section stats-breakdown-section">
                <div className="stats-section-heading"><p>By category</p></div>
                {renderCategoryRows(dailyCategories, dailyTotal)}
              </section>
            </>
          )}
        </div>
      )}

      {mode === 'weekly' && (
        <div className="stats-view animate-fade-in">
          <section className="stats-section stats-breakdown-section">
            <div className="stats-section-heading"><p>Week composition</p><span>Share of recorded time</span></div>
            {renderCategoryRows(weeklyCategories, weeklyTotal, true)}
          </section>

          <section className="stats-section stats-matrix-section">
            <div className="stats-section-heading"><p>Activity map</p><span>Each day’s composition</span></div>
            <div className="stats-matrix" style={{ gridTemplateColumns: 'minmax(72px, 1.4fr) repeat(7, minmax(26px, 1fr))' }}>
              <span />
              {WEEK_DAYS.map(day => <span className="stats-matrix-day" key={day}>{day}</span>)}
              {weeklyCategories.map(category => {
                const color = categoryColor(category.typeId, sessionTypes)
                return [
                  <span className="stats-matrix-name" key={`${category.typeId}-name`}>{category.name}</span>,
                  ...WEEK_DAYS.map((_, dayIndex) => {
                    const start = addCalendarDays(selectedWeek, dayIndex).getTime()
                    const end = addCalendarDays(selectedWeek, dayIndex + 1).getTime()
                    const daySessions = weeklySessions.filter(session => session.startTime >= start && session.startTime < end)
                    const dayTotal = daySessions.reduce((total, session) => total + sessionDuration(session), 0)
                    const duration = daySessions
                      .filter(session => session.typeId === category.typeId)
                      .reduce((total, session) => total + sessionDuration(session), 0)
                    const share = dayTotal > 0 ? duration / dayTotal : 0
                    return (
                      <button
                        key={`${category.typeId}-${dayIndex}`}
                        className={`stats-matrix-cell${duration > 0 ? ' is-filled' : ''}`}
                        style={duration > 0 ? {
                          background: colorWithAlpha(color, 0.24 + share * 0.66),
                          borderColor: colorWithAlpha(color, 0.42 + share * 0.35),
                        } : undefined}
                        disabled={duration === 0}
                        aria-label={duration > 0 ? `${WEEK_DAYS[dayIndex]}, ${category.name}: ${formatRecordedTotal(duration)}` : `${WEEK_DAYS[dayIndex]}, no ${category.name} recorded`}
                        onClick={() => setMatrixDetail({ typeId: category.typeId, dayIndex })}
                      />
                    )
                  }),
                ]
              })}
            </div>
            {matrixDetail && (() => {
              const category = weeklyCategories.find(item => item.typeId === matrixDetail.typeId)
              if (!category) return null
              const start = addCalendarDays(selectedWeek, matrixDetail.dayIndex).getTime()
              const end = addCalendarDays(selectedWeek, matrixDetail.dayIndex + 1).getTime()
              const daySessions = weeklySessions.filter(session => session.startTime >= start && session.startTime < end)
              const dayTotal = daySessions.reduce((total, session) => total + sessionDuration(session), 0)
              const duration = daySessions.filter(session => session.typeId === category.typeId).reduce((total, session) => total + sessionDuration(session), 0)
              return (
                <div className="stats-matrix-detail animate-fade-in">
                  <span style={{ background: categoryColor(category.typeId, sessionTypes) }} />
                  <div><strong>{WEEK_DAYS[matrixDetail.dayIndex]} · {category.name}</strong><small>{formatRecordedTotal(duration)} · {Math.round((duration / dayTotal) * 100)}% of that day&apos;s recorded time</small></div>
                  <button onClick={() => setMatrixDetail(null)} aria-label="Close detail">×</button>
                </div>
              )
            })()}
          </section>
        </div>
      )}

      <nav className="stats-page-navigation" aria-label="Stats navigation">
        <button onClick={onRecord}>
          <span>Record</span>
          <svg width={15} height={15} viewBox="0 0 15 15" aria-hidden="true">
            <path d="m9.2 3.7-3.7 3.8 3.7 3.8" fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </nav>
    </div>
  )
}
