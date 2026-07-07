import { useState } from 'react'
import { prefsRepository } from '../data/prefsRepository'
import { usePref } from '../hooks/usePref'
import { useT } from '../i18n/I18nContext'
import { DEFAULT_DRIFT_PROMPT_MINUTES } from '../components/timer/DriftPrompt'
import styles from '../components/settings/settings.module.css'

const TIME_OPTIONS = ['08:00', '09:00', '10:00', '12:00'] as const
const DRIFT_INTERVAL_OPTIONS = [10, 15, 30, 60] as const

type PermissionState = NotificationPermission | 'unsupported'

function currentPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

/** Notification preferences (spec §2). Honest about web limits — see settings.webNote copy. */
export function SettingsScreen() {
  const { t } = useT()
  const reminder = usePref('reminder')
  const driftPrompt = usePref('driftPrompt')
  const [permission, setPermission] = useState<PermissionState>(currentPermission)

  async function requestPermission() {
    if (typeof Notification === 'undefined') return
    setPermission(await Notification.requestPermission())
  }

  async function setReminderTime(value: string) {
    await prefsRepository.set('reminder', { firstSessionTime: value === '' ? null : value })
  }

  async function setDriftInterval(value: string) {
    await prefsRepository.set('driftPrompt', {
      intervalMinutes: value === '' ? null : Number(value),
    })
  }

  const driftMinutes =
    driftPrompt === undefined ? DEFAULT_DRIFT_PROMPT_MINUTES : driftPrompt.intervalMinutes

  return (
    <main className="app-shell">
      <section className={styles.settings}>
        <h1 className={styles.heading}>{t('settings.title')}</h1>

        <section className={styles.section} aria-labelledby="settings-notifications">
          <h2 id="settings-notifications" className={styles.sectionTitle}>
            {t('settings.notifications')}
          </h2>
          <p className={styles.status}>{t(`settings.permission.${permission}`)}</p>
          {permission === 'default' && (
            <button
              type="button"
              className={styles.requestBtn}
              onClick={() => void requestPermission()}
            >
              {t('settings.permission.request')}
            </button>
          )}
          <label className={styles.field}>
            {t('settings.reminderLabel')}
            <select
              className={styles.select}
              value={reminder?.firstSessionTime ?? ''}
              onChange={(e) => void setReminderTime(e.target.value)}
            >
              <option value="">{t('settings.reminderOff')}</option>
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <p className={styles.note}>{t('settings.webNote')}</p>
        </section>

        <section className={styles.section} aria-labelledby="settings-session">
          <h2 id="settings-session" className={styles.sectionTitle}>
            {t('settings.session')}
          </h2>
          <label className={styles.field}>
            {t('settings.driftPromptLabel')}
            <select
              className={styles.select}
              value={driftMinutes === null ? '' : String(driftMinutes)}
              onChange={(e) => void setDriftInterval(e.target.value)}
            >
              <option value="">{t('settings.reminderOff')}</option>
              {DRIFT_INTERVAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={String(minutes)}>
                  {t('settings.minutes', { count: minutes })}
                </option>
              ))}
            </select>
          </label>
        </section>
      </section>
    </main>
  )
}
