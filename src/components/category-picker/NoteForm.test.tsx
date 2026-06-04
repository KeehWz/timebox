import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { NoteForm } from './NoteForm'

describe('NoteForm', () => {
  it('submits the typed note', async () => {
    const onStart = vi.fn()
    renderWithI18n(<NoteForm categoryId="work" onBack={() => {}} onStart={onStart} />)
    await userEvent.type(screen.getByRole('textbox'), 'execution model')
    await userEvent.click(screen.getByRole('button', { name: /开始/ }))
    expect(onStart).toHaveBeenCalledWith('execution model')
  })

  it('starts with an empty note when Enter is pressed immediately', async () => {
    const onStart = vi.fn()
    renderWithI18n(<NoteForm categoryId="study" onBack={() => {}} onStart={onStart} />)
    await userEvent.type(screen.getByRole('textbox'), '{Enter}')
    expect(onStart).toHaveBeenCalledWith('')
  })

  it('calls onBack when “重选” is clicked', async () => {
    const onBack = vi.fn()
    renderWithI18n(<NoteForm categoryId="rest" onBack={onBack} onStart={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /重选/ }))
    expect(onBack).toHaveBeenCalled()
  })
})
