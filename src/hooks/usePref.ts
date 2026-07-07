import { useLiveQuery } from 'dexie-react-hooks'
import { prefsRepository } from '../data/prefsRepository'
import type { PrefKey, PrefsShape } from '../domain/prefs'

/** Live pref value. `undefined` = loading OR never set — callers should pick a default. */
export function usePref<K extends PrefKey>(key: K): PrefsShape[K] | undefined {
  return useLiveQuery(() => prefsRepository.get(key), [key])
}
