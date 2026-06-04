import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CategoryId } from '../domain/session'
import { sessionRepository } from '../data/sessionRepository'
import { ActiveSessionExistsError } from '../lib/errors'
import { CategoryPicker } from '../components/category-picker/CategoryPicker'
import { NoteForm } from '../components/category-picker/NoteForm'

export function HomeScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<CategoryId | null>(null)

  async function startSession(note: string) {
    if (selected === null) return
    try {
      await sessionRepository.start(selected, note)
    } catch (error) {
      // A session already exists (e.g. opened in another tab) — just navigate to it.
      if (!(error instanceof ActiveSessionExistsError)) throw error
    }
    navigate('/active')
  }

  return (
    <main className="app-shell">
      {selected === null ? (
        <CategoryPicker onSelect={setSelected} />
      ) : (
        <NoteForm categoryId={selected} onBack={() => setSelected(null)} onStart={startSession} />
      )}
    </main>
  )
}
