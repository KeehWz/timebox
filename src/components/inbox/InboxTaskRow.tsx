import type { Task } from '../../domain/task'
import { useT } from '../../i18n/I18nContext'
import styles from './inbox.module.css'

interface InboxTaskRowProps {
  task: Task
  onPlay: (task: Task) => void
  onSchedule: (task: Task) => void
  onToggleDone: (task: Task) => void
  onCycleEstimate: (task: Task) => void
}

/** One open task (design row): title + estimate chip, then play / schedule / done actions. */
export function InboxTaskRow({
  task,
  onPlay,
  onSchedule,
  onToggleDone,
  onCycleEstimate,
}: InboxTaskRowProps) {
  const { t } = useT()
  return (
    <li className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.rowTitle}>{task.title}</span>
        <button
          type="button"
          className={styles.estimateChip}
          onClick={() => onCycleEstimate(task)}
        >
          {t('inbox.estimate', { min: task.estimateMin })}
        </button>
      </div>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={t('inbox.playAria', { title: task.title })}
        onClick={() => onPlay(task)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M4 2.5v9l7.5-4.5z" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={t('inbox.schedAria', { title: task.title })}
        onClick={() => onSchedule(task)}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="14" height="12.5" rx="3" />
          <path d="M3 8.5h14M7 2.5v3M13 2.5v3" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={t('inbox.doneAria', { title: task.title })}
        onClick={() => onToggleDone(task)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 7.5l3 3 6-7" />
        </svg>
      </button>
    </li>
  )
}
