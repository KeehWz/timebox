import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { sessionRepository } from '../data/sessionRepository'
import { useT } from '../i18n/I18nContext'
import { SessionSummary } from '../components/summary/SessionSummary'
import styles from '../components/summary/summary.module.css'

export function SummaryScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useT()
  const session = useLiveQuery(
    () => (id ? sessionRepository.getById(id) : Promise.resolve(null)),
    [id],
  )

  if (session === undefined) {
    return <main className="app-shell" aria-busy="true" />
  }
  if (session === null) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="app-shell">
      <SessionSummary session={session} />
      {/* spec §12: use completion as a transition into the next action.
          Check-In / Drift actions join this row in Phase 3 (plan §3.4). */}
      <footer className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => navigate('/', { state: { startNew: true } })}
        >
          {t('summary.startNew')}
        </button>
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
