import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CategoryId } from '../domain/session'
import { getCategory } from '../domain/categories'
import { lastUsedCategoryId } from '../domain/categoryStats'
import { sessionRepository } from '../data/sessionRepository'
import { checkInRepository } from '../data/checkInRepository'
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
import { CheckInForm } from '../components/checkin/CheckInForm'
import styles from '../components/home/home.module.css'

/**
 * Start flow (spec §6): idle → pick → note → transition → /active.
 * The session is created when the transition finishes, so it never eats into focus time.
 * Drift (spec §9) skips picking and runs a neutral transition; check-in (spec §10) is a
 * one-field form that stays on Home.
 */
type Flow =
  | { step: 'idle' }
  | { step: 'pick' }
  | { step: 'note'; categoryId: CategoryId }
  | { step: 'transition'; categoryId: CategoryId; note: string; drift?: boolean }
  | { step: 'checkin' }

/** Router-state deep links from summary / onboarding / start-day. */
interface HomeDeepLink {
  startNew?: boolean
  checkIn?: boolean
  drift?: boolean
}

function initialFlow(state: HomeDeepLink | null): Flow {
  if (state?.startNew) return { step: 'pick' }
  if (state?.checkIn) return { step: 'checkin' }
  if (state?.drift) return { step: 'transition', categoryId: 'other', note: '', drift: true }
  return { step: 'idle' }
}

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
  // Deep links land directly in the right step (lazy initializer — HomeScreen mounts fresh
  // on every route change to '/').
  const [flow, setFlow] = useState<Flow>(() => initialFlow(location.state as HomeDeepLink | null))

  // Clear the router state so refresh / back-navigation doesn't replay the deep link.
  useEffect(() => {
    const state = location.state as HomeDeepLink | null
    if (state?.startNew || state?.checkIn || state?.drift) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  async function begin(categoryId: CategoryId, note: string, drift: boolean) {
    try {
      await sessionRepository.start(categoryId, note, drift ? 'drift' : 'standard')
    } catch (error) {
      // A session already exists (e.g. opened in another tab) — just navigate to it.
      if (!(error instanceof ActiveSessionExistsError)) throw error
    }
    navigate('/active')
  }

  async function startCheckIn(label: string) {
    await checkInRepository.start(label)
    setFlow({ step: 'idle' })
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
          drift={flow.drift ?? false}
          onDone={() => void begin(flow.categoryId, flow.note, flow.drift ?? false)}
        />
      </main>
    )
  }

  if (flow.step === 'checkin') {
    return (
      <main className="app-shell">
        <section className={styles.state}>
          <CheckInForm
            onStart={(label) => void startCheckIn(label)}
            onCancel={() => setFlow({ step: 'idle' })}
          />
        </section>
      </main>
    )
  }

  const lastCategory = categoryStats ? lastUsedCategoryId(categoryStats) : null

  async function endDay() {
    await dayRepository.endDay(todayKey, Date.now())
    navigate('/day') // closure: land on the daily summary (spec §14)
  }

  const dayEnded = day?.endedAt != null

  const captureModesRow = (
    <div className={styles.actionRow}>
      <button
        type="button"
        className={styles.secondaryCta}
        onClick={() => setFlow({ step: 'checkin' })}
      >
        <span aria-hidden="true">📍</span> {t('home.checkIn')}
      </button>
      <button
        type="button"
        className={styles.secondaryCta}
        onClick={() =>
          setFlow({ step: 'transition', categoryId: 'other', note: '', drift: true })
        }
      >
        <span aria-hidden="true">🌫️</span> {t('home.drift')}
      </button>
    </div>
  )

  // State A — nothing recorded today (spec §1), with Check-In / Drift CTAs (spec §1 / plan §3.4).
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
            {captureModesRow}
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
          {captureModesRow}
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
