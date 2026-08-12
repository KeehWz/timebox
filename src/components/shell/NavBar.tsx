import { NavLink } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import styles from './shell.module.css'

export type IconName = 'focus' | 'calendar' | 'inbox' | 'stats' | 'settings'

const ITEMS = [
  { to: '/day', key: 'nav.today', icon: 'calendar', end: false },
  { to: '/', key: 'nav.focus', icon: 'focus', end: true },
  { to: '/inbox', key: 'nav.inbox', icon: 'inbox', end: false },
  { to: '/stats', key: 'nav.stats', icon: 'stats', end: false },
] as const

/* Stroke icon set ported from Timebox.dc.html (20×20, 1.7px stroke). */
export function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      className={styles.navIcon}
      width="21"
      height="21"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {name === 'focus' && (
        <>
          <circle cx="10" cy="10" r="7" />
          <circle cx="10" cy="10" r="2.4" fill="currentColor" stroke="none" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <rect x="3" y="4.5" width="14" height="12.5" rx="3" />
          <path d="M3 8.5h14M7 2.5v3M13 2.5v3" />
        </>
      )}
      {name === 'inbox' && (
        <>
          <path d="M3 11.5V6a2 2 0 012-2h10a2 2 0 012 2v5.5" />
          <path d="M3 11.5h4l1.5 2.5h3l1.5-2.5h4V15a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </>
      )}
      {name === 'stats' && (
        <path d="M4.5 16.5v-5M10 16.5V4.5M15.5 16.5V9" strokeWidth="1.9" strokeLinecap="round" />
      )}
      {name === 'settings' && (
        <>
          <circle cx="10" cy="10" r="2.6" />
          <path d="M10 2.8v2.4M10 14.8v2.4M2.8 10h2.4M14.8 10h2.4M4.9 4.9l1.7 1.7M13.4 13.4l1.7 1.7M15.1 4.9l-1.7 1.7M6.6 13.4l-1.7 1.7" />
        </>
      )}
    </svg>
  )
}

export function NavBar() {
  const { t } = useT()
  return (
    <ul className={styles.navList}>
      {ITEMS.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            <NavIcon name={item.icon} />
            <span>{t(item.key)}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
