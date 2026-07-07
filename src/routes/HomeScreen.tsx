import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CategoryId } from '../domain/session'
import { getCategory } from '../domain/categories'
import { lastUsedCategoryId } from '../domain/categoryStats'
import { sessionRepository } from '../data/sessionRepository'
import { ActiveSessionExistsError } from '../lib/errors'
import { dayRepository } from '../data/dayRepository'
import { toDayKey } from '../domain/time'
import { useNow } from '../hooks/useNow'
import { useTodayStats } from '../hooks/useTodayStats'
import { useCategoryStats } from '../hooks/useCategoryStats'
import { useDay } from '../hooks/useDay'
import { useDailyDirections } from '../hooks/useDailyDirections'
import { usePref } from '../hooks/usePref'
import { useT } from '../i18n/I18nContext'
import { CategoryPicker } from '../components/category-picker/CategoryPicker'
import { NoteForm } from '../components/category-picker/NoteForm'
import { StartTransition } from '../components/start/StartTransition'
import { TodaySummary } from '../components/home/TodaySummary'
import { ChallengeCard } from '../components/home/ChallengeCard'
import { DirectionStrip } from '../components/direction/DirectionStrip'
import styles from '../components/home/home.module.css'

/**
 * Start flow (spec §6): idle → pick → note → transition → /active.
 * The session is created when the transition finishes, so it never eats into focus time.
 */
type Flow =
  | { step: 'idle' }
  | { step: 'pick' }
  | { step: 'note'; categoryId: CategoryId }
  | { step: 'transition'; categoryId: CategoryId; note: string }

export function HomeScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useT()
  const now = useNow()
  const todayKey = toDayKey(now)
  const stats = useTodayStats(now)
  const categoryStats = useCategoryStats()
  const day = useDay(todayKey)
  const directions = useDailyDirections(todayKey)
  const challenge = usePref('challenge')
  // Deep link from the summary screen's "Start new session" next-action: land directly in
  // the picker (lazy initializer — HomeScreen mounts fresh on every route change to '/').
  const [flow, setFlow] = useState<Flow>(() =>
    (location.state as { startNew?: boolean } | null)?.startNew ? { step: 'pick' } : { step: 'idle' },
  )

  // Clear the router state so refresh / back-navigation doesn't reopen the picker.
  useEffect(() => {
    if ((location.state as { startNew?: boolean } | null)?.startNew) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  async function begin(categoryId: CategoryId, note: string) {
    try {
      await sessionRepository.start(categoryId, note)
    } catch (error) {
      // A session already exists (e.g. opened in another tab) — just navigate to it.
      if (!(error instanceof ActiveSessionExistsError)) throw error
    }
    navigate('/active')
  }

  if (stats === undefined) {
    return <main className="app-shell" aria-busy="true" />
  }

  if (flow.step === 'pick') {
    return (
      <main className="app-shell">
        <CategoryPicker onSelect={(id) => setFlow({ step: 'note', categoryId: id })} />
      </main>
    )
  }

  if (flow.step === 'note') {
    return (
      <main className="app-shell">
        <NoteForm
          categoryId={flow.categoryId}
          onBack={() => setFlow({ step: 'pick' })}
          onStart={(note) => setFlow({ step: 'transition', categoryId: flow.categoryId, note })}
        />
      </main>
    )
  }

  if (flow.step === 'transition') {
    return (
      <main className="app-shell">
        <StartTransition
          categoryId={flow.categoryId}
          firstOfDay={!stats.hasSession}
          onDone={() => void begin(flow.categoryId, flow.note)}
        />
      </main>
    )
  }

  const lastCategory = categoryStats ? lastUsedCategoryId(categoryStats) : null

  async function endDay() {
    await dayRepository.endDay(todayKey, Date.now())
    navigate('/day') // closure: land on the daily summary (spec §14)
  }

  const dayEnded = day?.endedAt != null

  // State A — nothing recorded today (spec §1). Check-In / Drift CTAs land in Phase 3.
  if (!stats.hasSession) {
    return (
      <main className="app-shell">
        <section className={styles.state}>
          <header>
            <h1 className={styles.title}>{t('home.firstTitle')}</h1>
            <p className={styles.subtitle}>{t('home.firstSubtitle')}</p>
          </header>
          {directions && <DirectionStrip directions={directions} />}
          {challenge && <ChallengeCard challenge={challenge} todayKey={todayKey} />}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryCta}
              onClick={() => setFlow({ step: 'pick' })}
            >
              {t('home.startFirst')}
            </button>
            <button
              type="button"
              className={styles.secondaryCta}
              onClick={() => navigate('/start-day')}
            >
              {t('home.startDay')}
            </button>
          </div>
        </section>
      </main>
    )
  }

  // State B — sessions already recorded today (spec §1).
  return (
    <main className="app-shell">
      <section className={styles.state}>
        <TodaySummary stats={stats} />
        {directions && <DirectionStrip directions={directions} />}
        {challenge && <ChallengeCard challenge={challenge} todayKey={todayKey} />}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={() => setFlow({ step: 'pick' })}
          >
            {t('home.startSession')}
          </button>
          {lastCategory && (
            <button
              type="button"
              className={styles.secondaryCta}
              onClick={() => setFlow({ step: 'transition', categoryId: lastCategory, note: '' })}
            >
              <span aria-hidden="true">{getCategory(lastCategory).icon}</span>{' '}
              {t('home.quickStart', { category: t(`category.${lastCategory}.label`) })}
            </button>
          )}
          <button type="button" className={styles.secondaryCta} onClick={() => navigate('/day')}>
            {t('home.viewToday')}
          </button>
          {dayEnded ? (
            <p className={styles.dayEndedNote}>{t('home.dayEnded')}</p>
          ) : (
            <button type="button" className={styles.ghostCta} onClick={() => void endDay()}>
              {t('home.endDay')}
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
