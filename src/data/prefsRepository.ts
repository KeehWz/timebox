import { db } from './db'
import type { PrefKey, PrefsShape } from '../domain/prefs'

/** Typed key/value prefs. `undefined` = never set (callers pick their own default). */
export const prefsRepository = {
  async get<K extends PrefKey>(key: K): Promise<PrefsShape[K] | undefined> {
    const row = await db.prefs.get(key)
    return row?.value as PrefsShape[K] | undefined
  },

  async set<K extends PrefKey>(key: K, value: PrefsShape[K]): Promise<void> {
    await db.prefs.put({ key, value })
  },
}
