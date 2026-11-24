import { randomUUID } from 'crypto'
import type { WebSocket } from 'ws'

const MAX_SESSIONS = Number(process.env.MAX_SESSIONS ?? 50)
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS_PER_SESSION ?? 20)
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_HOURS ?? 4) * 60 * 60 * 1000
export const GRACE_PERIOD_MS = Number(process.env.HOST_GRACE_PERIOD_SECONDS ?? 30) * 1000

export const FIBONACCI = [1, 2, 3, 5, 8, 13] as const

const COLOR_POOL = [
  { color: '#1d9bf0', shade: '#0e6aad', ink: '#ffffff' },
  { color: '#fe5f55', shade: '#b9362f', ink: '#ffffff' },
  { color: '#3fd49a', shade: '#22996c', ink: '#0a2b1e' },
  { color: '#b06fe0', shade: '#7e45ac', ink: '#ffffff' },
  { color: '#ff9a3d', shade: '#c76e1d', ink: '#3d1f00' },
]

export interface Player {
  id: string
  name: string
  initials: string
  color: string
  shade: string
  ink: string
  vote: number | null
  seq: number | null
  connected: boolean
  isHost: boolean
  ws: WebSocket | null
}

export interface Session {
  id: string
  hostToken: string
  phase: 'voting' | 'revealed'
  players: Map<string, Player>
  kickedTokens: Set<string>
  ticket: string | null
  voteSeq: number
  colorIndex: number
  lastActiveAt: Date
  hostGraceTimer?: ReturnType<typeof setTimeout>
}

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

export function toSessionView(session: Session): SessionView {
  return {
    id: session.id,
    phase: session.phase,
    ticket: session.ticket,
    players: Array.from(session.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      initials: p.initials,
      color: p.color,
      shade: p.shade,
      ink: p.ink,
      connected: p.connected,
      hasVoted: p.vote !== null,
      vote: session.phase === 'revealed' ? (p.vote ?? undefined) : undefined,
      seq: p.seq ?? undefined,
    })),
  }
}

class SessionStore {
  private sessions = new Map<string, Session>()

  get size() { return this.sessions.size }

  create(hostToken: string): Session {
    if (this.sessions.size >= MAX_SESSIONS) {
      throw new Error('MAX_SESSIONS_REACHED')
    }
    const id = randomUUID().replace(/-/g, '').slice(0, 12)
    const session: Session = {
      id,
      hostToken,
      phase: 'voting',
      players: new Map(),
      kickedTokens: new Set(),
      ticket: null,
      voteSeq: 0,
      colorIndex: 0,
      lastActiveAt: new Date(),
    }
    this.sessions.set(id, session)
    return session
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id)
  }

  delete(id: string): void {
    this.sessions.delete(id)
  }

  addPlayer(session: Session, name: string, ws: WebSocket): Player {
    if (session.players.size >= MAX_PLAYERS) {
      throw new Error('SESSION_FULL')
    }
    const token = randomUUID()
    const { color, shade, ink } = COLOR_POOL[session.colorIndex % COLOR_POOL.length]
    session.colorIndex++
    const player: Player = {
      id: token,
      name: name.trim(),
      initials: getInitials(name),
      color,
      shade,
      ink,
      vote: null,
      seq: null,
      connected: true,
      isHost: false,
      ws,
    }
    session.players.set(token, player)
    session.lastActiveAt = new Date()
    return player
  }

  startCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [id, session] of this.sessions) {
        if (now - session.lastActiveAt.getTime() > SESSION_TTL_MS) {
          for (const player of session.players.values()) {
            if (player.ws?.readyState === 1) {
              player.ws.send(JSON.stringify({ type: 'session-ended', reason: 'Session expired due to inactivity' }))
              player.ws.close()
            }
          }
          this.sessions.delete(id)
        }
      }
    }, 60_000)
  }
}

export const sessionStore = new SessionStore()
export { MAX_PLAYERS }
