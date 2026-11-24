import { motion } from 'framer-motion'
import type { PlayerView } from '../types'
import styles from './SeatsRow.module.css'

interface Props {
  players: PlayerView[]
  isHost?: boolean
  onKick?: (playerId: string) => void
}

export default function SeatsRow({ players, isHost, onKick }: Props) {
  if (players.length === 0) return null

  return (
    <div className={styles.row}>
      {players.map(player => (
        <div key={player.id} className={styles.seat}>
          {isHost && (
            <button
              className={styles.kickBtn}
              onClick={() => onKick?.(player.id)}
              title={`Remove ${player.name}`}
            >✕</button>
          )}
          <div className={styles.cardArea}>
            {player.hasVoted ? (
              <div className={styles.votedPlaceholder}>
                <div className={styles.checkChip}>✓</div>
              </div>
            ) : (
              <motion.div
                layoutId={`card-${player.id}`}
                className={styles.faceDownCard}
                style={{
                  backgroundColor: player.color,
                  boxShadow: `0 5px 0 ${player.shade}, 0 8px 12px rgba(0,0,0,.4)`,
                }}
              >
                <div className={styles.pip} />
              </motion.div>
            )}
          </div>
          <div
            className={styles.avatar}
            style={{
              backgroundColor: player.color,
              color: player.ink,
              boxShadow: player.hasVoted
                ? `0 0 0 3px #3fd49a, 0 0 12px rgba(63,212,154,.5), 0 4px 0 ${player.shade}`
                : `inset 0 1px 0 rgba(255,255,255,.2), 0 4px 0 ${player.shade}`,
            }}
          >
            {player.initials}
          </div>
          <span className={`${styles.name} ${!player.connected ? styles.offline : ''}`}>
            {player.name}
          </span>
        </div>
      ))}
    </div>
  )
}
