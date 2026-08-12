import type { CSSProperties } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES } from '../domain/categories'
import { sessionRepository } from '../data/sessionRepository'
import { taskRepository } from '../data/taskRepository'
import { useDayMilestones } from '../hooks/useDayMilestones'
import { useTasks } from '../hooks/useTasks'
import { useT } from '../i18n/I18nContext'
import { SessionSummary } from '../components/summary/SessionSummary'
import { MilestoneToast } from '../components/summary/MilestoneToast'
import styles from '../components/summary/summary.module.css'

export function SummaryScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useT()
  const session = useLiveQuery(
    () => (id ? sessionRepository.getById(id) : Promise.resolve(null)),
    [id],
  )
  const milestones = useDayMilestones(session?.dayKey)
  const tasks = useTasks()

  if (session === undefined) {
    return <main className="app-shell" aria-busy="true" />
  }
  if (session === null) {
    return <Navigate to="/" replace />
  }

  // Milestones stamped with this session's endedAt were earned by THIS session (spec §13).
  const earnedNow = (milestones ?? [])
    .filter((m) => m.firedAt === session.endedAt)
    .map((m) => m.kind)

  // Sessions started from an Inbox task offer to complete that task (design's Done flow).
  const linkedTask = session.taskId
    ? (tasks ?? []).find((task) => task.id === session.taskId)
    : undefined

  return (
    <main className="app-shell">
      <SessionSummary session={session} />
      <MilestoneToast kinds={earnedNow} />

      {linkedTask &&
        (linkedTask.doneAt === null ? (
          <button
            type="button"
            className={styles.taskDoneBtn}
            onClick={() => void taskRepository.setDone(linkedTask.id, true)}
          >
            ✓ {t('summary.taskDone')}
          </button>
        ) : (
          <p className={styles.taskDoneNote}>{t('summary.taskDoneDone')}</p>
        ))}

      {/* drift → post-hoc categorization (spec §9) */}
      {session.type === 'drift' && (
        <section className={styles.convert} aria-labelledby="convert-heading">
          <h2 id="convert-heading" className={styles.convertTitle}>
            {t('summary.convertTitle')}
          </h2>
          <div className={styles.convertRow}>
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={styles.convertBtn}
                style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
                onClick={() => void sessionRepository.convertToCategory(session.id, category.id)}
              >
                <span aria-hidden="true">{category.icon}</span>{' '}
                {t(`category.${category.id}.label`)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* spec §12: use completion as a transition into the next action (incl. §9/§10 modes). */}
      <footer className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => navigate('/', { state: { startNew: true } })}
        >
          {t('summary.startNew')}
        </button>
        <div className={styles.secondaryRow}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => navigate('/', { state: { checkIn: true } })}
          >
            {t('summary.startCheckIn')}
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => navigate('/', { state: { drift: true } })}
          >
            {t('summary.startDrift')}
          </button>
        </div>
        <div className={styles.secondaryRow}>
          <button type="button" className={styles.secondary} onClick={() => navigate('/day')}>
            {t('summary.viewToday')}
          </button>
          <button type="button" className={styles.secondary} onClick={() => navigate('/')}>
            {t('summary.home')}
          </button>
        </div>
      </footer>
    </main>
  )
}
