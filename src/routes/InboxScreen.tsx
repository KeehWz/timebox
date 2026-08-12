import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { openTasks, doneTasks, type Task } from '../domain/task'
import { taskRepository } from '../data/taskRepository'
import { sessionRepository } from '../data/sessionRepository'
import { ActiveSessionExistsError } from '../lib/errors'
import { useTasks } from '../hooks/useTasks'
import { useT } from '../i18n/I18nContext'
import { ScreenHeader } from '../components/shell/ScreenHeader'
import { InboxTaskRow } from '../components/inbox/InboxTaskRow'
import styles from '../components/inbox/inbox.module.css'

/**
 * Inbox tab (design: Timebox.dc.html): capture tasks, size them with the estimate chip,
 * then start focus right away, schedule them onto Today, or check them off.
 */
export function InboxScreen() {
  const { t } = useT()
  const navigate = useNavigate()
  const tasks = useTasks()
  const [title, setTitle] = useState('')

  const open = openTasks(tasks ?? [])
  const done = doneTasks(tasks ?? [])

  async function addTask(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    await taskRepository.add(title)
    setTitle('')
  }

  /** Start a focus session for the task (note = title, neutral type, linked via taskId). */
  async function play(task: Task) {
    try {
      await sessionRepository.start('other', task.title, 'standard', task.id)
    } catch (error) {
      if (!(error instanceof ActiveSessionExistsError)) throw error
    }
    navigate('/active')
  }

  /** Arm tap-to-place on the Today timeline (design's armed flow). */
  function schedule(task: Task) {
    navigate('/day', { state: { armTaskId: task.id } })
  }

  if (tasks === undefined) {
    return <main className="app-shell" aria-busy="true" />
  }

  return (
    <main className="app-shell">
      <ScreenHeader title={t('inbox.title')} />

      <form className={styles.addRow} onSubmit={(event) => void addTask(event)}>
        <input
          className={styles.addInput}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('inbox.placeholder')}
          enterKeyHint="done"
        />
        <button type="submit" className={styles.addBtn} aria-label={t('inbox.addAria')}>
          +
        </button>
      </form>

      {open.length === 0 && <p className={styles.empty}>{t('inbox.empty')}</p>}

      <ul className={styles.list}>
        {open.map((task) => (
          <InboxTaskRow
            key={task.id}
            task={task}
            onPlay={(target) => void play(target)}
            onSchedule={schedule}
            onToggleDone={(target) => void taskRepository.setDone(target.id, true)}
            onCycleEstimate={(target) => void taskRepository.cycleEstimate(target.id)}
          />
        ))}
      </ul>

      {done.length > 0 && (
        <>
          <h2 className={styles.doneTitle}>{t('inbox.doneTitle')}</h2>
          <ul className={styles.list}>
            {done.map((task) => (
              <li key={task.id} className={`${styles.row} ${styles.rowDone}`}>
                <span className={styles.doneText}>{task.title}</span>
                <button
                  type="button"
                  className={styles.undoBtn}
                  aria-label={t('inbox.undoAria', { title: task.title })}
                  onClick={() => void taskRepository.setDone(task.id, false)}
                >
                  {t('inbox.undo')}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
