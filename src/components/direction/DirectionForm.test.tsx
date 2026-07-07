import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { DirectionForm } from './DirectionForm'

describe('DirectionForm', () => {
  it('confirms the selected categories with their targets', async () => {
    const onConfirm = vi.fn()
    renderWithI18n(<DirectionForm onConfirm={onConfirm} onSkip={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: /工作/ }))
    await userEvent.selectOptions(screen.getByLabelText('工作的时间目标'), '3600000')
    await userEvent.click(screen.getByRole('button', { name: /运动/ }))
    await userEvent.click(screen.getByRole('button', { name: '就这样开始' }))

    expect(onConfirm).toHaveBeenCalledWith([
      { categoryId: 'work', targetDurationMs: 3_600_000 },
      { categoryId: 'exercise', targetDurationMs: null },
    ])
  })

  it('deselecting removes a category from the result', async () => {
    const onConfirm = vi.fn()
    renderWithI18n(<DirectionForm onConfirm={onConfirm} onSkip={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: /工作/ }))
    await userEvent.click(screen.getByRole('button', { name: /工作/ }))
    await userEvent.click(screen.getByRole('button', { name: '就这样开始' }))

    expect(onConfirm).toHaveBeenCalledWith([])
  })

  it('skip bypasses selection entirely', async () => {
    const onSkip = vi.fn()
    renderWithI18n(<DirectionForm onConfirm={() => {}} onSkip={onSkip} />)
    await userEvent.click(screen.getByRole('button', { name: '跳过' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
