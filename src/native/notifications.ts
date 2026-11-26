import { LocalNotifications } from '@capacitor/local-notifications'
import { SESSION_NUDGE_ID, UNMARKED_ID, type PlannedNotification } from '../domain/notifications'

// iOS only (loaded from App.tsx when running in the native app). Replaces whatever is pending
// with what the current state plans. Permission is asked the first time there is something to
// schedule; if it is refused, nothing is scheduled and nothing else changes.

let applied = ''
let queue: Promise<void> = Promise.resolve()

async function apply(planned: PlannedNotification[]) {
  const key = JSON.stringify(planned)
  if (key === applied) return
  await LocalNotifications.cancel({ notifications: [{ id: SESSION_NUDGE_ID }, { id: UNMARKED_ID }] })
  applied = key
  if (planned.length === 0) return

  let { display } = await LocalNotifications.checkPermissions()
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    display = (await LocalNotifications.requestPermissions()).display
  }
  if (display !== 'granted') return

  await LocalNotifications.schedule({
    notifications: planned.map(item => ({
      id: item.id,
      title: item.title,
      body: item.body,
      schedule: { at: new Date(item.at), allowWhileIdle: true },
    })),
  })
}

/** Serialised, so quick successive state changes cannot interleave cancel and schedule. */
export function syncNotifications(planned: PlannedNotification[]): Promise<void> {
  queue = queue.then(() => apply(planned)).catch(error => {
    applied = '' // try again on the next change
    console.error('[timebox] could not update notifications', error)
  })
  return queue
}
