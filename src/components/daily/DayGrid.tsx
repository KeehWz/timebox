import { useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Session } from '../../domain/session'
import type { CheckIn } from '../../domain/checkIn'
import type { Task } from '../../domain/task'
import {
  PX_PER_HOUR,
  gridWindow,
  gridHeight,
  yForMinute,
  minuteForY,
  clampBlockStart,
  hourMarks,
  formatMinute,
  type GridSpan,
} from '../../domain/dayGrid'
import { categoryAccent } from '../../domain/categories'
import { activeMs } from '../../domain/metrics'
import { formatDuration, toDayKey } from '../../domain/time'
import { taskRepository } from '../../data/taskRepository'
import { useCategoryResolver } from '../../hooks/useCategoryResolver'
import { useT } from '../../i18n/I18nContext'
import styles from './daily.module.css'

const TAP_SNAP_MIN = 30
const DRAG_SNAP_MIN = 15

interface DayGridProps {
  sessions: Session[]
  checkIns: CheckIn[]
  /** Tasks scheduled on this day (planning layer, draggable). */
  tasks: Task[]
  dayKey: string
  isToday: boolean
  now: number
  /** Task armed for tap-to-place (from the Inbox schedule action), or null. */
  armedTask: Task | null
  onDisarm: () => void
  onStartFocus: (task: Task) => void
}

function minutesOf(epochMs: number): number {
  const d = new Date(epochMs)
  return d.getHours() * 60 + d.getMinutes()
}

interface DragInfo {
  taskId: string
  pointerStartY: number
  originMin: number
  estimateMin: number
  lastMin: number
  moved: boolean
}

/**
 * Hour-grid timeline (design: Timebox.dc.html "Today"). Recorded sessions and check-ins
 * render as solid blocks (the actual day); scheduled tasks render as dashed planning blocks
 * that can be dragged to move, tapped for Focus / Done / Unschedule, and placed by tapping
 * the grid when armed from the Inbox.
 */
export function DayGrid({
  sessions,
  checkIns,
  tasks,
  isToday,
  now,
  armedTask,
  onDisarm,
  onStartFocus,
}: DayGridProps) {
  const { t, locale } = useT()
  const resolve = useCategoryResolver()
  const gridRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragInfo | null>(null)
  const suppressTapRef = useRef(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const nowMin = minutesOf(now)
  const spans: GridSpan[] = [
    ...sessions.map((s) => ({
      startMin: minutesOf(s.startedAt),
      endMin: minutesOf(s.endedAt ?? now) + 1,
    })),
    ...checkIns.map((c) => ({
      startMin: minutesOf(c.startedAt),
      endMin: minutesOf(c.endedAt ?? now) + 1,
    })),
    ...tasks.map((task) => ({
      startMin: task.startMin ?? 0,
      endMin: (task.startMin ?? 0) + task.estimateMin,
    })),
    ...(isToday ? [{ startMin: nowMin, endMin: nowMin }] : []),
  ]
  const gridWin = gridWindow(spans)
  const height = gridHeight(gridWin)
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  function yToMinute(clientY: number, snap: number): number | null {
    const el = gridRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const scale = rect.height / el.offsetHeight || 1
    return minuteForY((clientY - rect.top) / scale, gridWin, snap)
  }

  function handleGridClick(event: { clientY: number }) {
    if (suppressTapRef.current) {
      suppressTapRef.current = false
      return
    }
    if (!armedTask) {
      if (selectedTaskId) setSelectedTaskId(null)
      return
    }
    const minute = yToMinute(event.clientY, TAP_SNAP_MIN)
    if (minute === null) return
    const start = clampBlockStart(minute, armedTask.estimateMin, gridWin)
    void taskRepository.schedule(armedTask.id, toDayKey(now), start)
    onDisarm()
  }

  function handleTaskPointerDown(task: Task, event: ReactPointerEvent) {
    event.preventDefault()
    const el = gridRef.current
    if (!el) return
    dragRef.current = {
      taskId: task.id,
      pointerStartY: event.clientY,
      originMin: task.startMin ?? gridWin.startMin,
      estimateMin: task.estimateMin,
      lastMin: task.startMin ?? gridWin.startMin,
      moved: false,
    }
    window.addEventListener('pointermove', handleDragMove)
    window.addEventListener('pointerup', handleDragUp)
  }

  function handleDragMove(event: PointerEvent) {
    const drag = dragRef.current
    const el = gridRef.current
    if (!drag || !el) return
    const rect = el.getBoundingClientRect()
    const scale = rect.height / el.offsetHeight || 1
    const deltaMin = (((event.clientY - drag.pointerStartY) / scale) * 60) / PX_PER_HOUR
    if (Math.abs(deltaMin) > 3) drag.moved = true
    const snapped = Math.round((drag.originMin + deltaMin) / DRAG_SNAP_MIN) * DRAG_SNAP_MIN
    const next = clampBlockStart(snapped, drag.estimateMin, gridWin)
    if (next !== drag.lastMin) {
      drag.lastMin = next
      void taskRepository.move(drag.taskId, next)
    }
  }

  function handleDragUp() {
    const drag = dragRef.current
    dragRef.current = null
    window.removeEventListener('pointermove', handleDragMove)
    window.removeEventListener('pointerup', handleDragUp)
    if (drag) {
      if (!drag.moved) {
        setSelectedTaskId((current) => (current === drag.taskId ? null : drag.taskId))
      }
      suppressTapRef.current = true
    }
  }

  return (
    <section className={styles.gridSection}>
      {armedTask && (
        <div className={styles.armedBanner}>
          <span className={styles.armedText}>{t('today.armed', { title: armedTask.title })}</span>
          <button type="button" className={styles.armedCancel} onClick={onDisarm}>
            {t('today.armedCancel')}
          </button>
        </div>
      )}

      <div
        ref={gridRef}
        className={armedTask ? `${styles.grid} ${styles.gridArmed}` : styles.grid}
        style={{ height: `${height}px` }}
        onClick={handleGridClick}
      >
        {hourMarks(gridWin).map((minute) => (
          <div
            key={minute}
            className={styles.hourRule}
            style={{ top: `${yForMinute(minute, gridWin)}px` }}
            aria-hidden="true"
          >
            <span className={styles.hourLabel}>{formatMinute(minute)}</span>
            <span className={styles.hourLine} />
          </div>
        ))}

        {isToday && nowMin >= gridWin.startMin && nowMin <= gridWin.endMin && (
          <div
            className={styles.nowLine}
            style={{ top: `${yForMinute(nowMin, gridWin)}px` }}
            aria-hidden="true"
          >
            <span className={styles.nowDot} />
            <span className={styles.nowRule} />
          </div>
        )}

        {sessions.map((session) => {
          const startMin = minutesOf(session.startedAt)
          const endMin = Math.max(startMin + 1, minutesOf(session.endedAt ?? now))
          const top = yForMinute(startMin, gridWin)
          const blockHeight = Math.max(24, yForMinute(endMin, gridWin) - top - 2)
          const category = resolve(session.categoryId)
          const ongoing = session.status !== 'completed'
          const title =
            session.note ||
            (session.type === 'drift' ? t('drift.label') : category.displayLabel)
          return (
            <div
              key={session.id}
              className={ongoing ? `${styles.block} ${styles.blockOngoing}` : styles.block}
              style={
                {
                  top: `${top + 1}px`,
                  height: `${blockHeight}px`,
                  '--accent': categoryAccent(category),
                } as CSSProperties
              }
            >
              <div className={styles.blockHead}>
                <span className={styles.blockDot} aria-hidden="true" />
                <span className={styles.blockTitle}>{title}</span>
                <span className={styles.blockTime}>
                  {formatMinute(startMin)} · {formatDuration(activeMs(session, now), locale)}
                </span>
              </div>
            </div>
          )
        })}

        {checkIns.map((checkIn) => {
          const startMin = minutesOf(checkIn.startedAt)
          const top = yForMinute(startMin, gridWin)
          return (
            <div
              key={checkIn.id}
              className={styles.checkInChip}
              style={{ top: `${top}px` }}
            >
              <span aria-hidden="true">📍</span> {checkIn.label} · {formatMinute(startMin)}
            </div>
          )
        })}

        {tasks.map((task) => {
          const startMin = task.startMin ?? gridWin.startMin
          const top = yForMinute(startMin, gridWin)
          const blockHeight = Math.max(28, (task.estimateMin / 60) * PX_PER_HOUR - 2)
          const selected = task.id === selectedTaskId
          const done = task.doneAt !== null
          return (
            <div
              key={task.id}
              className={[
                styles.block,
                styles.taskBlock,
                selected ? styles.taskSelected : '',
                done ? styles.taskDone : '',
              ].join(' ')}
              style={{ top: `${top + 1}px`, height: `${blockHeight}px` } as CSSProperties}
              onPointerDown={(event) => handleTaskPointerDown(task, event)}
            >
              <div className={styles.blockHead}>
                <span className={`${styles.blockDot} ${styles.taskDot}`} aria-hidden="true" />
                <span className={done ? `${styles.blockTitle} ${styles.taskDoneText}` : styles.blockTitle}>
                  {task.title}
                </span>
                <span className={styles.blockTime}>
                  {formatMinute(startMin)} · {task.estimateMin}m
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {selectedTask && (
        <div className={styles.taskActions}>
          <button
            type="button"
            className={styles.taskActionPrimary}
            onClick={() => {
              setSelectedTaskId(null)
              onStartFocus(selectedTask)
            }}
          >
            {t('today.blockFocus')}
          </button>
          <button
            type="button"
            className={styles.taskAction}
            onClick={() =>
              void taskRepository.setDone(selectedTask.id, selectedTask.doneAt === null)
            }
          >
            {selectedTask.doneAt === null ? t('today.blockDone') : t('today.blockUndo')}
          </button>
          <button
            type="button"
            className={styles.taskAction}
            onClick={() => {
              setSelectedTaskId(null)
              void taskRepository.unschedule(selectedTask.id)
            }}
          >
            {t('today.blockUnschedule')}
          </button>
        </div>
      )}
    </section>
  )
}
