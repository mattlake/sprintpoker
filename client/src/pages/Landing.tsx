import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'

export default function Landing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function startSession() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json() as { error: string }
        throw new Error(body.error ?? 'Failed to create session')
      }
      const { hostUrl } = await res.json() as { hostUrl: string }
      const path = new URL(hostUrl).pathname
      navigate(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sprint Poker</h1>
        <p className={styles.sub}>Estimate together, reveal at once.</p>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.startBtn} onClick={startSession} disabled={loading}>
          {loading ? 'Starting…' : 'Start Session'}
        </button>
      </div>
    </div>
  )
}
