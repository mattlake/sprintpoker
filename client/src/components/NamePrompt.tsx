import { useState, type FormEvent } from 'react'
import styles from './NamePrompt.module.css'

interface Props {
  isHost?: boolean
  onJoin: (name: string, presenterMode: boolean) => void
}

export default function NamePrompt({ isHost, onJoin }: Props) {
  const [name, setName] = useState('')
  const [presenterMode, setPresenterMode] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onJoin(trimmed, presenterMode)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>What's your name?</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={32}
          />
          {isHost && (
            <label className={styles.presenterToggle}>
              <input
                type="checkbox"
                checked={presenterMode}
                onChange={e => setPresenterMode(e.target.checked)}
              />
              <span className={styles.presenterLabel}>
                Presenter Mode
                <span className={styles.presenterHint}>hides your card selection while screen sharing</span>
              </span>
            </label>
          )}
          <button className={styles.btn} type="submit" disabled={!name.trim()}>
            Join Table
          </button>
        </form>
      </div>
    </div>
  )
}
