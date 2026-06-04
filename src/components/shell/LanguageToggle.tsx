import { useT } from '../../i18n/I18nContext'
import { LOCALES, type Locale } from '../../i18n/locale'
import styles from './shell.module.css'

const LABEL: Record<Locale, string> = { zh: '中', en: 'EN' }

export function LanguageToggle() {
  const { locale, setLocale, t } = useT()
  return (
    <div className={styles.langToggle} role="group" aria-label={t('lang.toggleAria')}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className={
            option === locale ? `${styles.langBtn} ${styles.langBtnActive}` : styles.langBtn
          }
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
        >
          {LABEL[option]}
        </button>
      ))}
    </div>
  )
}
