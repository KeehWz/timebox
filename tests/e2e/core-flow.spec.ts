import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // Each Playwright context is isolated, but clear IndexedDB defensively for a clean slate.
  await page.evaluate(() => indexedDB.deleteDatabase('timebox'))
  await page.reload()
})

test('core flow: state A → pick → note → transition → timer → pause → resume → long-press end → summary → daily', async ({
  page,
}) => {
  // home State A (nothing tracked today) → enter the picker
  await expect(page.getByRole('heading', { name: '今天还没有开始记录' })).toBeVisible()
  await page.getByRole('button', { name: '开始第一个 Session' }).click()
  await expect(page.getByRole('heading', { name: '你想记录什么？' })).toBeVisible()

  // pick a type, add a note, start
  await page.getByRole('button', { name: /工作/ }).click()
  await page.getByRole('textbox').fill('execution model')
  await page.getByRole('button', { name: /开始/ }).click()

  // start transition (first of day, ~2.6s) plays, then the timer begins
  await expect(page.getByText('准备开始…')).toBeVisible()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
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

  // home is now State B with today's summary and quick actions
  await page.getByRole('link', { name: /记录/ }).click()
  await expect(page.getByRole('heading', { name: '今日进展' })).toBeVisible()
  await expect(page.getByRole('button', { name: /再来一次：工作/ })).toBeVisible()
})

test('quick start begins the last category again after a short transition', async ({ page }) => {
  // seed one completed session via the normal flow
  await page.getByRole('button', { name: '开始第一个 Session' }).click()
  await page.getByRole('button', { name: /工作/ }).click()
  await page.getByRole('button', { name: /开始/ }).click()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await page.getByRole('button', { name: /长按结束/ }).hover()
  await page.mouse.down()
  await page.waitForTimeout(2100)
  await page.mouse.up()
  await expect(page).toHaveURL(/\/summary\//)

  // back home → State B → quick start
  await page.getByRole('button', { name: '回到首页' }).click()
  await page.getByRole('button', { name: /再来一次：工作/ }).click()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await expect(page.getByText('工作')).toBeVisible()
})

test('language toggle switches every string between zh and en', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '今天还没有开始记录' })).toBeVisible()

  await page.getByRole('button', { name: 'EN' }).click()
  await expect(page.getByRole('heading', { name: 'Nothing tracked yet today' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Track/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Today/ })).toBeVisible()

  await page.getByRole('button', { name: '中' }).click()
  await expect(page.getByRole('heading', { name: '今天还没有开始记录' })).toBeVisible()
})

test('nav shell moves between Track and Today', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /今天/ }).click()
  await expect(page).toHaveURL(/\/day$/)
  await page.getByRole('link', { name: /记录/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('home renders at key breakpoints', async ({ page }) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '今天还没有开始记录' })).toBeVisible()
    await expect(page).toHaveScreenshot(`home-${width}.png`, {
      fullPage: true,
      animations: 'disabled',
    })
  }
})
