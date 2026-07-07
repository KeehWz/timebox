import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { db } from '../../data/db'
import { checkInRepository } from '../../data/checkInRepository'
import { CheckInChip } from './CheckInChip'

beforeEach(async () => {
  await db.checkIns.clear()
})

describe('CheckInChip', () => {
  it('renders nothing without an open check-in', async () => {
    const { container } = renderWithI18n(<CheckInChip />)
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('shows the open check-in and ends it on click', async () => {
    await checkInRepository.start('Lunch')
    renderWithI18n(<CheckInChip />)

    await waitFor(() => expect(screen.getByText(/打卡中：Lunch/)).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: '结束' }))
    await waitFor(() => expect(screen.queryByText(/打卡中：Lunch/)).not.toBeInTheDocument())
    expect(await checkInRepository.getOpen()).toBeNull()
  })
})
