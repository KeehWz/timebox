import { Link } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import { NavIcon } from './NavBar'
import styles from './shell.module.css'

interface ScreenHeaderProps {
  title: string
  /** Show the settings gear next to the date (design keeps settings out of the tab bar). */
  showSettings?: boolean
}

/** Design screen header: serif title left, short date (+ optional settings gear) right. */
export function ScreenHeader({ title, showSettings = false }: ScreenHeaderProps) {
  const { t, locale } = useT()
  const dateLabel = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <header className={styles.screenHead}>
      <h1 className={styles.screenTitle}>{title}</h1>
      <div className={styles.screenMeta}>
        <span>{dateLabel}</span>
        {showSettings && (
          <Link to="/settings" className={styles.gearLink} aria-label={t('nav.settings')}>
            <NavIcon name="settings" />
          </Link>
        )}
      </div>
    </header>
  )
}
