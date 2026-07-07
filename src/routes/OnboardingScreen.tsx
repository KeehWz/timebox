import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prefsRepository } from '../data/prefsRepository'
import { toDayKey } from '../domain/time'
import { useT } from '../i18n/I18nContext'
import styles from '../components/home/home.module.css'

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const

/**
 * First-launch onboarding (spec §16): purpose → session tracking → challenge intro →
 * start first session. Completing (or skipping) also arms the three-day challenge (§17).
 */
export function OnboardingScreen() {
  const navigate = useNavigate()
  const { t } = useT()
  const [index, setIndex] = useState(0)
  const step = STEPS[index]
  const last = index === STEPS.length - 1

  async function complete(startFirstSession: boolean) {
    await prefsRepository.set('onboardingCompleted', true)
    await prefsRepository.set('challenge', {
      startDate: toDayKey(Date.now()),
      completed: [false, false, false],
    })
    navigate('/', startFirstSession ? { state: { startNew: true } } : undefined)
  }

  return (
    <main className="app-shell">
      <section className={styles.state} aria-live="polite">
        <header>
          <p className={styles.subtitle}>
            {index + 1} / {STEPS.length}
          </p>
          <h1 className={styles.title}>{t(`onboarding.${step}.title`)}</h1>
          <p className={styles.subtitle}>{t(`onboarding.${step}.body`)}</p>
        </header>
        <div className={styles.actions}>
          {last ? (
            <button
              type="button"
              className={styles.primaryCta}
              onClick={() => void complete(true)}
            >
              {t('onboarding.start')}
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryCta}
              onClick={() => setIndex(index + 1)}
            >
              {t('onboarding.next')}
            </button>
          )}
          <button type="button" className={styles.ghostCta} onClick={() => void complete(false)}>
            {t('onboarding.skip')}
          </button>
        </div>
      </section>
    </main>
  )
}
