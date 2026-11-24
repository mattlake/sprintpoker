import { motion } from 'framer-motion'
import type { SessionView, PlayerView } from '../types'
import { computeStats } from '../utils/stats'
import styles from './CenterTable.module.css'

const SUITS: Record<number, { glyph: string; color: string }> = {
  1:  { glyph: '♠', color: '#2b2b3a' },
  2:  { glyph: '♥', color: '#fe5f55' },
  3:  { glyph: '♦', color: '#ff9a3d' },
  5:  { glyph: '♣', color: '#1d9bf0' },
  8:  { glyph: '♠', color: '#2b2b3a' },
  13: { glyph: '♥', color: '#fe5f55' },
}

const TILTS = [-3, 4, -2, 3, -5, 2, -4, 1]
const tilt = (seq: number) => TILTS[seq % TILTS.length]

function sortedBySeq(players: PlayerView[]): PlayerView[] {
  return [...players].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
}

interface Props {
  session: SessionView
  isHost: boolean
  onReveal: () => void
  onNextRound: () => void
}

export default function CenterTable({ session, isHost, onReveal, onNextRound }: Props) {
  const { phase, players } = session
  const votedPlayers = sortedBySeq(players.filter(p => p.hasVoted))
  const total = players.length
  const votedCount = votedPlayers.length

  if (phase === 'voting') {
    return (
      <div className={styles.table}>
        {votedPlayers.length === 0 ? (
          <p className={styles.waiting}>waiting for the table to play…</p>
        ) : (
          <div className={styles.faceDownRow}>
            {votedPlayers.map(p => (
              <motion.div
                key={p.id}
                layoutId={`card-${p.id}`}
                className={styles.faceDownCard}
                style={{
                  backgroundColor: p.color,
                  boxShadow: `0 7px 0 ${p.shade}, 0 10px 14px rgba(0,0,0,.4)`,
                  rotate: tilt(p.seq ?? 0),
                }}
              >
                <div className={styles.pip} />
              </motion.div>
            ))}
          </div>
        )}
        <div className={styles.votingFooter}>
          <p className={styles.count}>
            <span className={styles.countNum}>{votedCount}</span>
            {' / '}
            <span className={styles.countNum}>{total}</span>
            {' PLAYED'}
          </p>
          {isHost && (
            <button className={styles.revealBtn} onClick={onReveal}>
              REVEAL HAND
            </button>
          )}
        </div>
      </div>
    )
  }

  // Revealed phase
  const stats = computeStats(players)

  return (
    <div className={styles.table}>
      {stats?.isConsensus && (
        <div className={styles.consensusBanner}>★ CONSENSUS ★</div>
      )}

      {stats && (
        <div className={styles.heroRow}>
          {stats.modes.map((mode, i) => {
            const modeStr = String(mode)
            return (
              <motion.div
                key={mode}
                className={styles.heroCard}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: i * 0.1 }}
              >
                <span className={styles.heroPipTop}>☆</span>
                <span
                  className={styles.heroValue}
                  style={{ fontSize: modeStr.length > 2 ? '56px' : '80px' }}
                >
                  {mode}
                </span>
                <div className={styles.heroBand}>MODE</div>
                <span className={styles.heroPipBottom}>☆</span>
              </motion.div>
            )
          })}
        </div>
      )}

      {stats && (
        <p className={styles.statsFooter}>
          <span className={styles.statLabel}>MEAN</span>
          {' '}
          <span className={styles.statValue}>{stats.mean}</span>
          <span className={styles.statDivider}> | </span>
          <span className={styles.statLabel}>MEDIAN</span>
          {' '}
          <span className={styles.statValue}>{stats.median}</span>
        </p>
      )}

      {isHost && (
        <div className={styles.hostControls}>
          <button className={styles.nextRoundBtn} onClick={onNextRound}>Another round?</button>
        </div>
      )}

      <div className={styles.revealedRow}>
        {sortedBySeq(votedPlayers).map((p, i) => {
          const suit = SUITS[p.vote!] ?? { glyph: '♠', color: '#2b2b3a' }
          return (
            <motion.div
              key={p.id}
              className={styles.revealedCard}
              style={{ rotate: tilt(p.seq ?? 0), transformPerspective: 600 }}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.08 }}
            >
              <span className={styles.revealedSuit} style={{ color: suit.color }}>
                {suit.glyph}
              </span>
              <span className={styles.revealedValue}>{p.vote}</span>
              <div
                className={styles.revealedBand}
                style={{ backgroundColor: p.color, color: p.ink }}
              >
                {p.initials}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
