import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../data/db'
import { prefsRepository } from '../data/prefsRepository'

/**
 * Redirect brand-new users to onboarding (spec §16). Existing users (sessions present but
 * pref unset — i.e. upgrading from v1) are marked completed silently instead of being onboarded.
 * One-shot on mount.
 */
export function useOnboardingGate(): void {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (location.pathname === '/welcome') return
      const done = await prefsRepository.get('onboardingCompleted')
      if (done) return
      const count = await db.sessions.count()
      if (count > 0) {
        await prefsRepository.set('onboardingCompleted', true)
        return
      }
      if (!cancelled) navigate('/welcome', { replace: true })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount by design
  }, [])
}
