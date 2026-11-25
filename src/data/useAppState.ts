import { useLiveQuery } from 'dexie-react-hooks'
import { loadState, type AppState } from './store'

/** Live snapshot of the local store; `undefined` until the first read resolves. */
export function useAppState(): AppState | undefined {
  return useLiveQuery(loadState)
}
