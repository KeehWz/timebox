import { NavLink } from 'react-router-dom'
import { useT } from '../../i18n/I18nContext'
import styles from './shell.module.css'

const ITEMS = [
  { to: '/', key: 'nav.track', icon: '⏱', end: true },
  { to: '/day', key: 'nav.today', icon: '📅', end: false },
  { to: '/settings', key: 'nav.settings', icon: '⚙️', end: false },
] as const

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
            <span className={styles.navIcon} aria-hidden="true">
              {item.icon}
            </span>
            <span>{t(item.key)}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
