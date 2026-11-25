import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { loadState, type AppState } from './store'

/** Live snapshot of the local store; `undefined` until the first read resolves. */
export function useAppState(): AppState | undefined {
  return useLiveQuery(loadState)
}

/**
 * True when the local database cannot be opened (site data blocked, some private windows, a
 * failed upgrade). The live query never resolves in that case, so without this the page stays blank.
 */
export function useStorageFailed(): boolean {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    db.open().catch(error => {
      console.error('[timebox] cannot open local database', error)
      setFailed(true)
    })
  }, [])
  return failed
}
