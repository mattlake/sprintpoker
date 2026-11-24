import { useState, useEffect, type KeyboardEvent } from 'react'
import { useParams } from 'react-router-dom'
import { LayoutGroup } from 'framer-motion'
import { useRoom } from '../hooks/useRoom'
import NamePrompt from '../components/NamePrompt'
import SeatsRow from '../components/SeatsRow'
import HandFan from '../components/HandFan'
import CenterTable from '../components/CenterTable'
import styles from './Room.module.css'

export default function Room() {
  const { sessionId, hostToken } = useParams<{ sessionId: string; hostToken?: string }>()
  const isHost = Boolean(hostToken)
  const { connPhase, session, myPlayerId, error, joinWithName, vote, reveal, setTicket, nextRound, kick } =
    useRoom(sessionId!, hostToken)

  const [myVote, setMyVote] = useState<number | null>(null)
  const [ticketInput, setTicketInput] = useState('')
  const [ticketFocused, setTicketFocused] = useState(false)
  const [copied, setCopied] = useState(false)
  const [presenterMode, setPresenterMode] = useState(false)

  const participantUrl = `${window.location.origin}/s/${sessionId}`

  function copyInviteLink() {
    navigator.clipboard.writeText(participantUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Clear local vote when round resets
  useEffect(() => {
    if (session?.phase === 'voting') setMyVote(null)
  }, [session?.phase])

  // Sync ticket input from server when not focused
  useEffect(() => {
    if (!ticketFocused) setTicketInput(session?.ticket ?? '')
  }, [session?.ticket, ticketFocused])

  function handleVote(value: number) {
    setMyVote(value)
    vote(value)
  }

  function commitTicket() {
    setTicketFocused(false)
    setTicket(ticketInput)
  }

  function handleTicketKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
  }

  if (connPhase === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.fullscreen}>
          <p className={styles.message}>{error ?? 'Something went wrong.'}</p>
        </div>
      </div>
    )
  }

  if (connPhase === 'ended') {
    return (
      <div className={styles.page}>
        <div className={styles.fullscreen}>
          <p className={styles.message}>The host has left — this session has ended.</p>
        </div>
      </div>
    )
  }

  if (connPhase === 'kicked') {
    return (
      <div className={styles.page}>
        <div className={styles.fullscreen}>
          <p className={styles.message}>You've been removed from this session.</p>
        </div>
      </div>
    )
  }

  const otherPlayers = session?.players.filter(p => p.id !== myPlayerId) ?? []

  return (
    <div className={styles.page}>
      {connPhase === 'naming' && (
        <NamePrompt
          isHost={isHost}
          onJoin={(name, pm) => { setPresenterMode(pm); joinWithName(name) }}
        />
      )}

      <div className={styles.header}>
        <div className={styles.ticketPill}>
          {isHost ? (
            <input
              className={styles.ticketInput}
              value={ticketInput}
              placeholder="Add ticket (optional)"
              maxLength={40}
              onChange={e => setTicketInput(e.target.value)}
              onFocus={() => setTicketFocused(true)}
              onBlur={commitTicket}
              onKeyDown={handleTicketKey}
            />
          ) : session?.ticket ? (
            <span className={styles.ticketKey}>{session.ticket}</span>
          ) : (
            <span className={styles.ticketPlaceholder}>No ticket set</span>
          )}
          {isHost && <span className={styles.hostBadge}>HOST</span>}
          {isHost && presenterMode && <span className={styles.presenterBadge}>PRESENTING</span>}
        </div>
        <span className={styles.subLabel}>NOW ESTIMATING</span>
        {isHost && (
          <button className={styles.copyBtn} onClick={copyInviteLink}>
            {copied ? '✓ COPIED' : '⎘ COPY INVITE LINK'}
          </button>
        )}
      </div>

      <LayoutGroup>
        <SeatsRow players={otherPlayers} isHost={isHost} onKick={kick} />

        {session ? (
          <CenterTable
            session={session}
            isHost={isHost}
            onReveal={reveal}
            onNextRound={nextRound}
          />
        ) : (
          <div className={styles.tableEmpty}>
            {connPhase === 'connecting' && <p className={styles.waiting}>Connecting…</p>}
          </div>
        )}
      </LayoutGroup>

      {session?.phase === 'voting' && connPhase === 'connected' && (
        <HandFan myVote={myVote} onVote={handleVote} presenterMode={presenterMode} />
      )}
    </div>
  )
}
