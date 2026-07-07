import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { CheckInForm } from './CheckInForm'

describe('CheckInForm', () => {
  it('submits the label via Enter', async () => {
    const onStart = vi.fn()
    renderWithI18n(<CheckInForm onStart={onStart} onCancel={() => {}} />)
    await userEvent.type(screen.getByRole('textbox'), '午饭{Enter}')
    expect(onStart).toHaveBeenCalledWith('午饭')
  })

  it('will not start with an empty label', async () => {
    const onStart = vi.fn()
    renderWithI18n(<CheckInForm onStart={onStart} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: '开始打卡' })).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox'), '   {Enter}')
    expect(onStart).not.toHaveBeenCalled()
  })

  it('cancel backs out', async () => {
    const onCancel = vi.fn()
    renderWithI18n(<CheckInForm onStart={() => {}} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
