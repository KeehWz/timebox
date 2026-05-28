import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { sessionRepository } from '../data/sessionRepository'
import { SessionSummary } from '../components/summary/SessionSummary'
import styles from '../components/summary/summary.module.css'

export function SummaryScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      <footer className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => navigate('/day')}>
          查看今天
        </button>
        <button type="button" className={styles.primary} onClick={() => navigate('/')}>
          完成
        </button>
      </footer>
    </main>
  )
}
