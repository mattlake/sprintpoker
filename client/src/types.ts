export interface PlayerView {
  id: string
  name: string
  initials: string
  color: string
  shade: string
  ink: string
  connected: boolean
  hasVoted: boolean
  vote?: number
  seq?: number
}

export interface SessionView {
  id: string
  phase: 'voting' | 'revealed'
  ticket: string | null
  players: PlayerView[]
}

export type ConnPhase = 'connecting' | 'naming' | 'connected' | 'error' | 'ended' | 'kicked'
