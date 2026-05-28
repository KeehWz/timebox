import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // Each Playwright context is isolated, but clear IndexedDB defensively for a clean slate.
  await page.evaluate(() => indexedDB.deleteDatabase('timebox'))
  await page.reload()
})

test('core flow: pick → note → timer → pause → resume → long-press end → summary → daily', async ({
  page,
}) => {
  await expect(page.getByRole('heading', { name: '你想记录什么？' })).toBeVisible()

  // pick a type, add a note, start
  await page.getByRole('button', { name: /工作/ }).click()
  await page.getByRole('textbox').fill('execution model')
  await page.getByRole('button', { name: /开始/ }).click()

  // active session with a running clock
  await expect(page).toHaveURL(/\/active$/)
  await expect(page.getByText('execution model')).toBeVisible()
  await expect(page.locator('time')).toBeVisible()

  // quick-pause then resume
  await page.getByRole('button', { name: '快速暂停' }).click()
  await expect(page.getByText(/已暂停/)).toBeVisible()
  await page.getByRole('button', { name: '继续' }).click()

  // long-press to end (hold past HOLD_DURATION_MS = 1700ms)
  await page.getByRole('button', { name: /长按结束/ }).hover()
  await page.mouse.down()
  await page.waitForTimeout(2100)
  await page.mouse.up()

  // summary
  await expect(page).toHaveURL(/\/summary\//)
  await expect(page.getByText('已记录')).toBeVisible()
  await expect(page.getByText('execution model')).toBeVisible()

  // daily record
  await page.getByRole('button', { name: '查看今天' }).click()
  await expect(page).toHaveURL(/\/day$/)
  await expect(page.getByText('execution model')).toBeVisible()
  await expect(page.getByText('今日汇总')).toBeVisible()
})

test('home renders at key breakpoints', async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '你想记录什么？' })).toBeVisible()
    await expect(page).toHaveScreenshot(`home-${width}.png`, {
      fullPage: true,
      animations: 'disabled',
    })
  }
})
