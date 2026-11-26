import { expect, test, type Page } from '@playwright/test'

/** Press and hold the End control past its 900ms threshold. */
async function holdToEnd(page: Page) {
  const end = page.getByRole('button', { name: 'Hold to end session' })
  await end.dispatchEvent('pointerdown')
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
}

/** Open the app and answer the first-launch privacy note. */
async function openApp(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sounds good', exact: true }).click()
}

async function startWorkSession(page: Page) {
  await page.getByRole('button', { name: /^Open Work settings Work/ }).click()
  await expect(page.getByRole('heading', { name: 'What are you working on?' })).toBeVisible()
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause session' })).toBeVisible()
}

test('a day: start, record, review, direction, end', async ({ page }) => {
  await openApp(page)

  // Start Today
  await page.getByRole('button', { name: 'Start Today' }).click()
  await expect(page.getByText('since start')).toBeVisible()

  // Record a Work session with a pause in the middle
  await startWorkSession(page)
  await expect(page.getByRole('paragraph').filter({ hasText: 'Projects' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause session' }).click()
  await expect(page.getByText('Paused', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Resume session' }).click()
  await holdToEnd(page)

  // Session summary: the note is editable and only affects this recording
  await page.getByPlaceholder('What was this time for?').fill('Quarterly report')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('1 recording', { exact: true })).toBeVisible()

  // Everything survives a reload
  await page.reload()
  await expect(page.getByText('1 recording', { exact: true })).toBeVisible()
  await expect(page.getByText('since start')).toBeVisible()

  // Stats shows the recording on today's timeline and in the breakdown
  await page.getByRole('button', { name: 'Stats' }).first().click()
  await expect(page.getByText('Day timeline')).toBeVisible()
  await expect(page.getByText('By category')).toBeVisible()
  await expect(page.locator('.stats-category-name', { hasText: 'Work' })).toBeVisible()
  await page.getByRole('tab', { name: 'Weekly' }).click()
  await expect(page.getByText('Week composition')).toBeVisible()
  await page.getByRole('button', { name: 'Record', exact: true }).click()

  // Today's Direction: give Work around an hour
  await page.getByRole('button', { name: 'Direction' }).first().click()
  await page.locator('.direction-compact-row', { hasText: 'Work' }).click()
  await page.getByRole('button', { name: 'General Work' }).click()
  await page.getByRole('button', { name: '1h', exact: true }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.locator('.direction-compact-row.is-selected', { hasText: 'Work' })).toContainText('1h')
  await page.getByRole('button', { name: 'Record', exact: true }).click()

  // End Today → reflection → back to a fresh day
  await page.getByRole('button', { name: 'End Today' }).first().click()
  await page.locator('.end-confirm').getByRole('button', { name: 'End Today' }).click()
  await expect(page.getByText('recorded', { exact: true })).toBeVisible()
  // An unfinished reflection reopens after a reload
  await page.reload()
  await expect(page.getByText('recorded', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('around 1h')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('The shape of today')).toBeVisible()
  await expect(page.getByText('Quarterly report')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByPlaceholder('Optional reflection...').fill('Steady day.')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText("That's all for today.")).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await expect(page.getByRole('button', { name: 'Start Today' })).toBeEnabled()
  // Direction belonged to the day that just closed
  await page.getByRole('button', { name: 'Direction' }).first().click()
  await expect(page.locator('.direction-compact-row.is-selected')).toHaveCount(0)
})

test('the back button returns to Record and closes Settings, instead of leaving the app', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Start Today', exact: true }).click()
  const onRecord = page.getByText(/^\d+(h \d+)?m since start$/)

  await page.getByRole('button', { name: 'Stats', exact: true }).first().click()
  await expect(page.getByRole('tablist', { name: 'Stats view', exact: true })).toBeVisible()
  await page.evaluate(() => history.back())
  await expect(onRecord).toBeVisible()

  // Going back through the UI does not leave extra entries behind
  await page.getByRole('button', { name: 'Direction', exact: true }).first().click()
  await page.getByRole('button', { name: 'Record', exact: true }).click()
  await expect(onRecord).toBeVisible()
  expect(await page.evaluate(() => history.state)).toBeNull()

  // Back closes Settings and stays on the page underneath
  await page.getByRole('button', { name: 'Stats', exact: true }).first().click()
  await page.getByRole('button', { name: 'Open settings', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Send feedback', exact: true })).toBeVisible()
  await page.evaluate(() => history.back())
  await expect(page.getByRole('button', { name: 'Send feedback', exact: true })).toHaveCount(0)
  await expect(page.getByRole('tablist', { name: 'Stats view', exact: true })).toBeVisible()
})

test('a running session survives a reload', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Start Today' }).click()
  await startWorkSession(page)

  await page.reload()
  await expect(page.getByRole('button', { name: 'Pause session' })).toBeVisible()
  await expect(page.getByRole('paragraph').filter({ hasText: 'Projects' })).toBeVisible()

  await holdToEnd(page)
})

test('a new category can be added and used', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Add category' }).click()
  await page.getByLabel('Category name').fill('Reading')
  await page.getByRole('button', { name: 'Choose study icon' }).click()
  await page.getByRole('button', { name: 'Create category' }).click()

  // Recording before Start Today starts the day on its own
  await page.getByRole('button', { name: /^Open Reading settings Reading/ }).click()
  await expect(page.getByRole('heading', { name: 'How are you spending this reading time?' })).toBeVisible()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await holdToEnd(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('since start')).toBeVisible()
})

test('a day that was never ended closes itself after 4am', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-10T09:00:00') })
  await openApp(page)
  await page.getByRole('button', { name: 'Start Today', exact: true }).click()
  await expect(page.getByText('since start')).toBeVisible()

  // Same night: still the same day
  await page.clock.setSystemTime(new Date('2026-11-11T01:00:00'))
  await page.reload()
  await expect(page.getByText('since start')).toBeVisible()

  // Next morning: yesterday is closed and today has not started
  await page.clock.setSystemTime(new Date('2026-11-11T09:00:00'))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Start Today', exact: true })).toBeEnabled()
  await expect(page.getByText('since start')).toHaveCount(0)
})

test('ending an overnight session by keyboard closes the stale day', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-10T23:00:00') })
  await openApp(page)
  await page.getByRole('button', { name: 'Start Today', exact: true }).click()
  await startWorkSession(page)

  // Next morning the session is still running, so the day stays open
  await page.clock.setSystemTime(new Date('2026-11-11T09:00:00'))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Pause session', exact: true })).toBeVisible()

  // No pointer: Enter asks for confirmation instead of requiring a hold
  await page.getByRole('button', { name: 'Hold to end session', exact: true }).press('Enter')
  const dialog = page.getByRole('dialog', { name: 'End session', exact: true })
  await dialog.getByRole('button', { name: 'Not yet', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Hold to end session', exact: true }).press('Enter')
  await dialog.getByRole('button', { name: 'End session', exact: true }).click()

  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Start Today', exact: true })).toBeEnabled()
})

test('says so when the local database cannot be opened', async ({ page }) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = () => { throw new DOMException('blocked', 'SecurityError') }
  })
  await page.goto('/')
  await expect(page.getByText("TimeBox couldn't open its storage", { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeVisible()
})

test('usage events and feedback reach the API, without anything the user typed', async ({ page }) => {
  const batches: { events: { name: string }[] }[] = []
  const feedback: { message: string; contact?: string }[] = []
  await page.route('**/api/events', async route => {
    batches.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, json: { saved: 1 } })
  })
  await page.route('**/api/feedback', async route => {
    feedback.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, json: { saved: 1 } })
  })
  const eventNames = () => batches.flatMap(batch => batch.events.map(event => event.name))

  await openApp(page)
  await page.getByRole('button', { name: 'Start Today', exact: true }).click()
  await startWorkSession(page)
  await holdToEnd(page)
  await page.getByPlaceholder('What was this time for?', { exact: true }).fill('Secret plan')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  await expect.poll(eventNames).toEqual(expect.arrayContaining(['app_open', 'day_start', 'session_start', 'session_end']))
  const sent = JSON.stringify(batches)
  for (const typed of ['Projects', 'Secret plan', 'Work']) expect(sent).not.toContain(typed)

  // Feedback from Settings
  await page.getByRole('button', { name: 'Open settings', exact: true }).click()
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  await page.getByRole('textbox', { name: 'Your feedback', exact: true }).fill('The timeline is lovely.')
  // A stray tap outside the sheet must not throw away what was typed
  await page.mouse.click(200, 30)
  await expect(page.getByRole('textbox', { name: 'Your feedback', exact: true })).toHaveValue('The timeline is lovely.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByText('Sent. Thank you for taking the time.', { exact: true })).toBeVisible()
  expect(feedback).toMatchObject([{ message: 'The timeline is lovely.' }])
  await page.getByRole('button', { name: 'Done', exact: true }).click()

  // Turning sharing off stops events
  const sharing = page.getByRole('switch', { name: /^Share anonymous usage/ })
  await expect(sharing).toHaveAttribute('aria-checked', 'true')
  await sharing.click()
  await expect(sharing).toHaveAttribute('aria-checked', 'false')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Stats', exact: true }).first().click()
  await expect(page.getByText('Day timeline', { exact: true })).toBeVisible()
  await page.waitForTimeout(500)
  expect(eventNames()).not.toContain('stats_view')
})

test('the privacy note is shown once and nothing is sent before it is answered', async ({ page }) => {
  const batches: { events: { name: string }[] }[] = []
  await page.route('**/api/events', async route => {
    batches.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, json: { saved: 1 } })
  })

  await page.goto('/')
  const note = page.getByRole('dialog', { name: 'A note on privacy', exact: true })
  await expect(note).toBeVisible()
  await page.mouse.click(200, 30) // tapping outside does not dismiss it
  await page.waitForTimeout(500)
  await expect(note).toBeVisible()
  expect(batches).toEqual([])

  await note.getByRole('button', { name: 'Sounds good', exact: true }).click()
  await expect(note).toHaveCount(0)
  await expect.poll(() => batches.flatMap(batch => batch.events.map(event => event.name))).toContain('app_open')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Start Today', exact: true })).toBeVisible()
  await expect(note).toHaveCount(0)
})

test('declining the privacy note turns sharing off and sends nothing', async ({ page }) => {
  let requests = 0
  await page.route('**/api/events', async route => {
    requests++
    await route.fulfill({ status: 200, json: { saved: 1 } })
  })

  await page.goto('/')
  await page.getByRole('button', { name: "Don't share", exact: true }).click()
  await page.getByRole('button', { name: 'Start Today', exact: true }).click()
  await page.getByRole('button', { name: 'Open settings', exact: true }).click()
  await expect(page.getByRole('switch', { name: /^Share anonymous usage/ })).toHaveAttribute('aria-checked', 'false')
  await page.waitForTimeout(500)
  expect(requests).toBe(0)
})

test('nothing sits under the status bar on a phone with a notch (iOS app)', async ({ page }) => {
  // Browsers report a zero top inset; the iOS app does not. Chrome can emulate it.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 59, bottom: 34 } })
  const STATUS_BAR = 59
  const top = async (locator: ReturnType<Page['getByRole']>) => (await locator.boundingBox())?.y ?? -1

  await openApp(page)
  await page.getByRole('button', { name: 'Start Today', exact: true }).click()
  expect(await top(page.getByRole('button', { name: 'Open settings', exact: true }))).toBeGreaterThanOrEqual(STATUS_BAR)
  expect(await top(page.getByRole('button', { name: 'Stats', exact: true }).first())).toBeGreaterThanOrEqual(STATUS_BAR)

  await page.getByRole('button', { name: 'Stats', exact: true }).first().click()
  expect(await top(page.getByRole('tablist', { name: 'Stats view', exact: true }))).toBeGreaterThanOrEqual(STATUS_BAR)

  await page.getByRole('button', { name: 'Open settings', exact: true }).click()
  await page.getByRole('button', { name: 'Send feedback', exact: true }).click()
  expect(await top(page.getByRole('button', { name: '← Settings', exact: true }))).toBeGreaterThanOrEqual(STATUS_BAR)
})

test('a late night stays on the day it started until End Today', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-10T22:30:00') })
  await openApp(page)
  await page.getByRole('button', { name: 'Start Today', exact: true }).click()

  // 23:00–00:30 across midnight, then 01:00–01:30 on the 11th, all before End Today
  const record = async (minutes: number) => {
    await startWorkSession(page)
    await page.clock.fastForward(minutes * 60_000)
    await holdToEnd(page)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  }
  await page.clock.fastForward(30 * 60_000)
  await record(90)
  await page.clock.fastForward(30 * 60_000)
  await record(30)

  // Stats opens on the day that is still open, not on the calendar date
  await page.getByRole('button', { name: 'Stats', exact: true }).first().click()
  await expect(page.getByText('Tuesday, November 10', { exact: true })).toBeVisible()
  await expect(page.getByText('2h recorded', { exact: true })).toBeVisible()

  // The week puts all of it on Tuesday
  await page.getByRole('tab', { name: 'Weekly', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tue, Work: 2h', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Wed, no Work recorded', exact: true })).toBeVisible()

  // After End Today, the 10th still holds both sessions and the 11th is empty
  await page.getByRole('button', { name: 'Record', exact: true }).click()
  await page.getByRole('button', { name: 'End Today', exact: true }).first().click()
  await page.locator('.end-confirm').getByRole('button', { name: 'End Today', exact: true }).click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Stats', exact: true }).first().click()
  await expect(page.getByText('Wednesday, November 11', { exact: true })).toBeVisible()
  await expect(page.getByText('0m recorded', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Previous day', exact: true }).click()
  await expect(page.getByText('Tuesday, November 10', { exact: true })).toBeVisible()
  await expect(page.getByText('2h recorded', { exact: true })).toBeVisible()
})
