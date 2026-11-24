import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage, Server } from 'http'
import { sessionStore, toSessionView, FIBONACCI, GRACE_PERIOD_MS, type Session, type SessionView } from './sessions.js'

type ServerMsg =
  | { type: 'joined'; token: string; playerId: string; session: SessionView }
  | { type: 'session-state'; session: SessionView }
  | { type: 'error'; code: string; message: string }
  | { type: 'session-ended'; reason: string }
  | { type: 'kicked' }

function send(ws: WebSocket, msg: ServerMsg): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

export function broadcast(session: Session, msg: ServerMsg, exclude?: WebSocket): void {
  for (const player of session.players.values()) {
    if (player.ws && player.ws !== exclude && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(msg))
    }
  }
}

function endSession(session: Session): void {
  broadcast(session, { type: 'session-ended', reason: 'Host disconnected' })
  for (const p of session.players.values()) p.ws?.close()
  sessionStore.delete(session.id)
}

function handleJoin(
  ws: WebSocket,
  session: Session,
  msg: { token?: string; name?: string; hostToken?: string },
): string | null {
  if (msg.token) {
    if (session.kickedTokens.has(msg.token)) {
      send(ws, { type: 'kicked' })
      ws.close()
      return null
    }
    const player = session.players.get(msg.token)
    if (!player) {
      send(ws, { type: 'error', code: 'TOKEN_NOT_FOUND', message: 'Session not recognised — please enter your name' })
      return null
    }
    player.connected = true
    player.ws = ws
    if (msg.hostToken && session.hostToken === msg.hostToken) {
      player.isHost = true
    }
    // Host reconnected — cancel the grace period
    if (player.isHost && session.hostGraceTimer) {
      clearTimeout(session.hostGraceTimer)
      session.hostGraceTimer = undefined
    }
    session.lastActiveAt = new Date()
    send(ws, { type: 'joined', token: player.id, playerId: player.id, session: toSessionView(session) })
    broadcast(session, { type: 'session-state', session: toSessionView(session) }, ws)
    return player.id
  }

  if (!msg.name?.trim()) {
    send(ws, { type: 'error', code: 'NAME_REQUIRED', message: 'Name is required' })
    return null
  }

  try {
    const player = sessionStore.addPlayer(session, msg.name, ws)
    if (msg.hostToken && session.hostToken === msg.hostToken) {
      player.isHost = true
    }
    send(ws, { type: 'joined', token: player.id, playerId: player.id, session: toSessionView(session) })
    broadcast(session, { type: 'session-state', session: toSessionView(session) }, ws)
    return player.id
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'SESSION_FULL') {
      send(ws, { type: 'error', code: 'SESSION_FULL', message: 'This session is full' })
      ws.close()
    }
    return null
  }
}

const FIBONACCI_SET = new Set<number>(FIBONACCI)

export function setupWebSocketServer(httpServer: Server): void {
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req: IncomingMessage, socket, head: Buffer) => {
    const url = req.url ?? ''
    if (url.startsWith('/ws/')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = req.url ?? ''
    const sessionId = url.split('?')[0].split('/')[2]

    const session = sessionStore.get(sessionId)
    if (!session) {
      send(ws, { type: 'error', code: 'SESSION_NOT_FOUND', message: 'Session not found' })
      ws.close()
      return
    }

    let currentPlayerId: string | null = null

    ws.on('message', (data: Buffer) => {
      let msg: {
        type: string
        token?: string
        name?: string
        hostToken?: string
        value?: number
        ticket?: string
        targetId?: string
      }
      try {
        msg = JSON.parse(data.toString())
      } catch {
        return
      }

      if (msg.type === 'join' && !currentPlayerId) {
        currentPlayerId = handleJoin(ws, session, msg)
        return
      }

      if (!currentPlayerId) return
      const player = session.players.get(currentPlayerId)
      if (!player) return

      if (msg.type === 'vote') {
        const value = msg.value
        if (typeof value !== 'number' || !FIBONACCI_SET.has(value)) return
        if (session.phase !== 'voting') return
        if (player.seq === null) player.seq = session.voteSeq++
        player.vote = value
        session.lastActiveAt = new Date()
        broadcast(session, { type: 'session-state', session: toSessionView(session) })
        return
      }

      if (msg.type === 'reveal') {
        if (!player.isHost || session.phase !== 'voting') return
        session.phase = 'revealed'
        session.lastActiveAt = new Date()
        broadcast(session, { type: 'session-state', session: toSessionView(session) })
        return
      }

      if (msg.type === 'set-ticket') {
        if (!player.isHost) return
        session.ticket = typeof msg.ticket === 'string' ? msg.ticket.trim() || null : null
        session.lastActiveAt = new Date()
        broadcast(session, { type: 'session-state', session: toSessionView(session) })
        return
      }

      if (msg.type === 'next-round') {
        if (!player.isHost || session.phase !== 'revealed') return
        for (const p of session.players.values()) { p.vote = null; p.seq = null }
        session.voteSeq = 0
        session.phase = 'voting'
        session.ticket = null
        session.lastActiveAt = new Date()
        broadcast(session, { type: 'session-state', session: toSessionView(session) })
        return
      }

      if (msg.type === 'kick') {
        if (!player.isHost) return
        const targetId = msg.targetId
        if (typeof targetId !== 'string' || targetId === currentPlayerId) return
        const target = session.players.get(targetId)
        if (!target) return
        session.kickedTokens.add(targetId)
        if (target.ws?.readyState === WebSocket.OPEN) {
          send(target.ws, { type: 'kicked' })
          target.ws.close()
        }
        session.players.delete(targetId)
        session.lastActiveAt = new Date()
        broadcast(session, { type: 'session-state', session: toSessionView(session) })
        return
      }
    })

    ws.on('close', () => {
      if (!currentPlayerId) return
      const player = session.players.get(currentPlayerId)
      if (!player) return
      player.connected = false
      player.ws = null

      if (player.isHost) {
        session.hostGraceTimer = setTimeout(() => endSession(session), GRACE_PERIOD_MS)
      }

      broadcast(session, { type: 'session-state', session: toSessionView(session) })
    })
  })
}
