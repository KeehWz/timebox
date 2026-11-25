import { expect, test, type Page } from '@playwright/test'

/** Press and hold the End control past its 900ms threshold. */
async function holdToEnd(page: Page) {
  const end = page.getByRole('button', { name: 'Hold to end session' })
  await end.dispatchEvent('pointerdown')
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
}

async function startWorkSession(page: Page) {
  await page.getByRole('button', { name: /^Open Work settings Work/ }).click()
  await expect(page.getByRole('heading', { name: 'What are you working on?' })).toBeVisible()
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause session' })).toBeVisible()
}

test('a day: start, record, review, direction, end', async ({ page }) => {
  await page.goto('/')

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
  await page.getByRole('button', { name: 'Record' }).click()

  // Today's Direction: give Work around an hour
  await page.getByRole('button', { name: 'Direction' }).first().click()
  await page.locator('.direction-compact-row', { hasText: 'Work' }).click()
  await page.getByRole('button', { name: 'General Work' }).click()
  await page.getByRole('button', { name: '1h', exact: true }).click()
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.locator('.direction-compact-row.is-selected', { hasText: 'Work' })).toContainText('1h')
  await page.getByRole('button', { name: 'Record' }).click()

  // End Today → reflection → back to a fresh day
  await page.getByRole('button', { name: 'End Today' }).first().click()
  await page.locator('.end-confirm').getByRole('button', { name: 'End Today' }).click()
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

test('a running session survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start Today' }).click()
  await startWorkSession(page)

  await page.reload()
  await expect(page.getByRole('button', { name: 'Pause session' })).toBeVisible()
  await expect(page.getByRole('paragraph').filter({ hasText: 'Projects' })).toBeVisible()

  await holdToEnd(page)
})

test('a new category can be added and used', async ({ page }) => {
  await page.goto('/')
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
