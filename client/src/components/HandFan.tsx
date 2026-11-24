import { useState } from 'react'
import styles from './HandFan.module.css'

const FIBONACCI = [1, 2, 3, 5, 8, 13]
const CENTER = (FIBONACCI.length - 1) / 2

const SUITS: Record<number, { glyph: string; color: string }> = {
  1:  { glyph: '♠', color: '#2b2b3a' },
  2:  { glyph: '♥', color: '#fe5f55' },
  3:  { glyph: '♦', color: '#ff9a3d' },
  5:  { glyph: '♣', color: '#1d9bf0' },
  8:  { glyph: '♠', color: '#2b2b3a' },
  13: { glyph: '♥', color: '#fe5f55' },
}

function cardTransform(index: number, hovered: boolean, selected: boolean): string {
  const offset = index - CENTER
  const rot = offset * 7
  const arc = offset * offset * 4
  const lift = selected ? arc - 44 : hovered ? arc - 30 : arc
  const scale = selected ? 1.08 : hovered ? 1.06 : 1
  return `rotate(${rot}deg) translateY(${lift}px) scale(${scale})`
}

interface Props {
  myVote: number | null
  onVote: (value: number) => void
  presenterMode?: boolean
}

export default function HandFan({ myVote, onVote, presenterMode }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={styles.area}>
      <span className={styles.label}>YOUR HAND · PLAY A CARD</span>
      <div className={styles.fan}>
        {FIBONACCI.map((value, index) => {
          const suit = SUITS[value]
          const selected = !presenterMode && myVote === value
          const hovered = !presenterMode && hoveredIndex === index && !selected
          return (
            <div
              key={value}
              className={styles.card}
              style={{
                transform: cardTransform(index, hovered, selected),
                zIndex: selected ? 60 : hovered ? 50 : index,
                borderColor: selected ? '#ffd23f' : '#efe6cc',
                boxShadow: selected
                  ? '0 8px 0 #cabf9e, 0 0 0 3px #ffd23f, 0 0 0 7px rgba(255,210,63,.45)'
                  : '0 8px 0 #cabf9e, 0 10px 14px rgba(0,0,0,.35)',
              }}
              onClick={() => onVote(value)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className={styles.suitTop} style={{ color: suit.color }}>{suit.glyph}</span>
              <span className={styles.value}>{value}</span>
              <span className={styles.suitBottom} style={{ color: suit.color }}>{suit.glyph}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
