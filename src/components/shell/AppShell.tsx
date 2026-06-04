import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { LanguageToggle } from './LanguageToggle'
import styles from './shell.module.css'

/** Cal-style layout: left sidebar on desktop, bottom tab bar on mobile. Wraps Home & Daily. */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <nav className={styles.rail} aria-label="Primary">
        <span className={styles.brand}>
          <span aria-hidden="true">⏱</span> Timebox
        </span>
        <NavBar />
        <div className={styles.railFoot}>
          <LanguageToggle />
        </div>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
