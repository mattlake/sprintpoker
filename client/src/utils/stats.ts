import type { PlayerView } from '../types'

export interface Stats {
  mean: string
  median: string
  modes: number[]
  isConsensus: boolean
}

export function computeStats(players: PlayerView[]): Stats | null {
  const voted = players.filter(p => p.vote !== undefined)
  if (voted.length === 0) return null

  const values = voted.map(p => p.vote!)
  const sorted = [...values].sort((a, b) => a - b)

  const sum = values.reduce((a, b) => a + b, 0)
  const mean = (sum / values.length).toFixed(1).replace(/\.0$/, '')

  const mid = Math.floor(sorted.length / 2)
  const medianVal = sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
  const median = medianVal.toFixed(1).replace(/\.0$/, '')

  const freq = new Map<number, number>()
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1)
  const maxFreq = Math.max(...freq.values())
  const modes = [...freq.entries()]
    .filter(([, f]) => f === maxFreq)
    .map(([v]) => v)
    .sort((a, b) => a - b)

  const allVoted = players.every(p => p.hasVoted)
  const isConsensus = allVoted && new Set(values).size === 1

  return { mean, median, modes, isConsensus }
}
