import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // Each Playwright context is isolated, but clear IndexedDB defensively for a clean slate.
  await page.evaluate(() => indexedDB.deleteDatabase('timebox'))
  await page.reload()
  // A fresh database routes brand-new users to onboarding — skip it so tests start on Home.
  await page.getByRole('button', { name: '跳过' }).click()
  await expect(page.getByRole('heading', { name: '今天还没有开始记录' })).toBeVisible()
})

test('onboarding walks four steps into the first-session picker', async ({ page }) => {
  await page.evaluate(() => indexedDB.deleteDatabase('timebox'))
  await page.reload()

  await expect(page.getByRole('heading', { name: '欢迎来到 Timebox' })).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByRole('heading', { name: '用 Session 记录' })).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByRole('heading', { name: '三天觉察挑战' })).toBeVisible()
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '开始第一个 Session' }).click()
  await expect(page.getByRole('heading', { name: '你想记录什么？' })).toBeVisible()
})

test('core flow: state A → pick → note → transition → timer → pause → resume → long-press end → summary → daily', async ({
  page,
}) => {
  // home State A (nothing tracked today) → enter the picker
  await expect(page.getByRole('heading', { name: '今天还没有开始记录' })).toBeVisible()
  await page.getByRole('button', { name: '开始第一个 Session' }).click()
  await expect(page.getByRole('heading', { name: '你想记录什么？' })).toBeVisible()

  // pick a type, add a note, start
  await page.getByRole('button', { name: /^工作/ }).click()
  await page.getByRole('textbox').fill('execution model')
  await page.getByRole('button', { name: /开始/ }).click()

  // start transition (first of day, ~2.6s) plays, then the timer begins
  await expect(page.getByText('准备开始…')).toBeVisible()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await expect(page.getByText('execution model')).toBeVisible()
  await expect(page.locator('time')).toBeVisible()

  // quick-pause then resume (the state label also reads 已暂停 — assert the note with the
  // running pause duration to stay unambiguous)
  await page.getByRole('button', { name: '快速暂停' }).click()
  await expect(page.getByText(/已暂停 · 暂停/)).toBeVisible()
  await page.getByRole('button', { name: '继续' }).click()

  // long-press to end (hold past HOLD_DURATION_MS = 1700ms)
  await page.getByRole('button', { name: /长按结束/ }).hover()
  await page.mouse.down()
  await page.waitForTimeout(2100)
  await page.mouse.up()

  // summary, including the first-session milestone (reward layer)
  await expect(page).toHaveURL(/\/summary\//)
  await expect(page.getByText('已记录')).toBeVisible()
  await expect(page.getByText('execution model')).toBeVisible()
  await expect(page.getByText('今日第一个 Session')).toBeVisible()

  // daily record
  await page.getByRole('button', { name: '查看今天' }).click()
  await expect(page).toHaveURL(/\/day$/)
  await expect(page.getByText('execution model')).toBeVisible()
  await expect(page.getByText('今日汇总')).toBeVisible()

  // home is now State B with today's summary and quick actions
  await page.getByRole('link', { name: /专注/ }).click()
  await expect(page.getByRole('heading', { name: '今日进展' })).toBeVisible()
  await expect(page.getByRole('button', { name: /再来一次：工作/ })).toBeVisible()
})

test('quick start begins the last category again after a short transition', async ({ page }) => {
  // seed one completed session via the normal flow
  await page.getByRole('button', { name: '开始第一个 Session' }).click()
  await page.getByRole('button', { name: /^工作/ }).click()
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
  await expect(page.getByRole('link', { name: /Focus/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Today/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Inbox/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Stats/ })).toBeVisible()

  await page.getByRole('button', { name: '中' }).click()
  await expect(page.getByRole('heading', { name: '今天还没有开始记录' })).toBeVisible()
})

test('day lifecycle: start day with direction → session → strip on home → end day', async ({
  page,
}) => {
  // Start Day → set a direction for 工作
  await page.getByRole('button', { name: '开始今天' }).click()
  await expect(page.getByRole('heading', { name: '今天想把时间放在哪里？' })).toBeVisible()
  await page.getByRole('button', { name: /工作/ }).click()
  await page.getByRole('button', { name: '就这样开始' }).click()

  // lands straight in the picker; run one quick session
  await expect(page.getByRole('heading', { name: '你想记录什么？' })).toBeVisible()
  await page.getByRole('button', { name: /^工作/ }).click()
  await page.getByRole('button', { name: /开始/ }).click()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await page.getByRole('button', { name: /长按结束/ }).hover()
  await page.mouse.down()
  await page.waitForTimeout(2100)
  await page.mouse.up()
  await expect(page).toHaveURL(/\/summary\//)

  // home State B shows the direction strip; end the day → daily summary
  await page.getByRole('button', { name: '回到首页' }).click()
  await expect(page.getByText('今日方向')).toBeVisible()
  await page.getByRole('button', { name: '结束今天' }).click()
  await expect(page).toHaveURL(/\/day$/)
  await expect(page.getByText('今日汇总')).toBeVisible()
})

test('drift: start → neutral timer → summary convert to category', async ({ page }) => {
  await page.getByRole('button', { name: /开始漂移/ }).click()

  // neutral transition → timer with the drift badge (the state label reads 漂移中, so
  // target the badge's full text to stay unambiguous)
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await expect(page.getByText('🌫️ 漂移')).toBeVisible()

  // end and convert on the summary
  await page.getByRole('button', { name: /长按结束/ }).hover()
  await page.mouse.down()
  await page.waitForTimeout(2100)
  await page.mouse.up()
  await expect(page).toHaveURL(/\/summary\//)
  await expect(page.getByText('把这段漂移归类为…')).toBeVisible()
  await page.getByRole('button', { name: /工作/ }).click()
  await expect(page.getByText('把这段漂移归类为…')).not.toBeVisible()
  await expect(page.getByText('工作')).toBeVisible()
})

test('check-in: label → persistent chip → end → daily timeline', async ({ page }) => {
  await page.getByRole('button', { name: /打卡/ }).click()
  await page.getByRole('textbox').fill('午饭')
  await page.getByRole('button', { name: '开始打卡' }).click()

  // chip persists across shell screens
  await expect(page.getByText(/打卡中：午饭/)).toBeVisible()
  await page.getByRole('link', { name: /今天/ }).click()
  await expect(page.getByText(/打卡中：午饭/)).toBeVisible()

  // end it; it stays on the daily timeline
  await page.getByRole('button', { name: '结束' }).click()
  await expect(page.getByText(/打卡中：午饭/)).not.toBeVisible()
  await expect(page.getByText(/午饭/)).toBeVisible()
})

test('nav shell moves across the four tabs', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /今天/ }).click()
  await expect(page).toHaveURL(/\/day$/)
  await page.getByRole('link', { name: /收集箱/ }).click()
  await expect(page).toHaveURL(/\/inbox$/)
  await page.getByRole('link', { name: /统计/ }).click()
  await expect(page).toHaveURL(/\/stats$/)
  await page.getByRole('link', { name: /专注/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('inbox: add task → focus from task → summary completes it', async ({ page }) => {
  await page.getByRole('link', { name: /收集箱/ }).click()
  await expect(page.getByText('收集箱清空了，真棒。')).toBeVisible()

  await page.getByPlaceholder('添加任务…').fill('写周报')
  await page.getByRole('button', { name: '添加任务' }).click()
  await expect(page.getByText('写周报')).toBeVisible()

  // estimate chip cycles 30 → 45
  await page.getByRole('button', { name: '30 分钟' }).click()
  await expect(page.getByRole('button', { name: '45 分钟' })).toBeVisible()

  // play → live timer carries the task title as the session note
  await page.getByRole('button', { name: '开始专注：写周报' }).click()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await expect(page.getByText('写周报')).toBeVisible()

  // end via long-press → summary offers to complete the linked task
  await page.getByRole('button', { name: /长按结束/ }).hover()
  await page.mouse.down()
  await page.waitForTimeout(2100)
  await page.mouse.up()
  await expect(page).toHaveURL(/\/summary\//)
  await page.getByRole('button', { name: /把任务标记为完成/ }).click()
  await expect(page.getByText('任务已完成 ✓')).toBeVisible()

  // the task now sits in the inbox Done section (summary is full-screen — go home first)
  await page.getByRole('button', { name: '回到首页' }).click()
  await page.getByRole('link', { name: /收集箱/ }).click()
  await expect(page.getByRole('heading', { name: '已完成' })).toBeVisible()
  await expect(page.getByText('写周报')).toBeVisible()
})

test('inbox: schedule arms tap-to-place on the Today timeline', async ({ page }) => {
  await page.getByRole('link', { name: /收集箱/ }).click()
  await page.getByPlaceholder('添加任务…').fill('健身')
  await page.getByRole('button', { name: '添加任务' }).click()
  await page.getByRole('button', { name: '安排到今天：健身' }).click()

  // lands on Today with the armed banner; tap the grid to place the block
  await expect(page).toHaveURL(/\/day$/)
  await expect(page.getByText(/点击时间轴放置/)).toBeVisible()
  const noon = await page.getByText('12:00', { exact: true }).boundingBox()
  if (!noon) throw new Error('timeline not rendered')
  await page.mouse.click(noon.x + 180, noon.y + 4)
  await expect(page.getByText(/点击时间轴放置/)).not.toBeVisible()
  await expect(page.getByText('健身')).toBeVisible()
})

test('custom focus type: create with an emoji and start a session with it', async ({ page }) => {
  await page.getByRole('button', { name: '开始第一个 Session' }).click()
  await page.getByRole('button', { name: /新建类型/ }).click()

  await page.getByLabel('名称').fill('吉他')
  await page.getByRole('button', { name: '🎸' }).click()
  await page.getByRole('button', { name: '创建' }).click()

  // the new tile appears in the grid and starts a session like any builtin
  await page.getByRole('button', { name: /吉他/ }).first().click()
  await page.getByRole('button', { name: /开始/ }).click()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await expect(page.getByText('吉他')).toBeVisible()
})

test('stats: cards, weekly bars and streak reflect a recorded session', async ({ page }) => {
  // record one quick session
  await page.getByRole('button', { name: '开始第一个 Session' }).click()
  await page.getByRole('button', { name: /^工作/ }).click()
  await page.getByRole('button', { name: /开始/ }).click()
  await expect(page).toHaveURL(/\/active$/, { timeout: 10_000 })
  await page.getByRole('button', { name: /长按结束/ }).hover()
  await page.mouse.down()
  await page.waitForTimeout(2100)
  await page.mouse.up()
  await expect(page).toHaveURL(/\/summary\//)

  // summary is full-screen — go home first, then open Stats from the tab bar
  await page.getByRole('button', { name: '回到首页' }).click()
  await page.getByRole('link', { name: /统计/ }).click()
  await expect(page.getByText('今日专注')).toBeVisible()
  await expect(page.getByText('完成任务')).toBeVisible()
  await expect(page.getByText('本周')).toBeVisible()
  await expect(page.getByText('连续专注')).toBeVisible()
  await expect(page.getByText('1 天')).toBeVisible()
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
