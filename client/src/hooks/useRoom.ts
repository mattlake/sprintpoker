import { useState, useEffect, useRef, useCallback } from 'react'
import type { SessionView, ConnPhase } from '../types'

const storageKey = (sessionId: string) => `sp:${sessionId}`

export function useRoom(sessionId: string, hostToken?: string) {
  const [connPhase, setConnPhase] = useState<ConnPhase>('connecting')
  const [session, setSession] = useState<SessionView | null>(null)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback((token?: string, name?: string) => {
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', token, name, hostToken }))
    }

    ws.onmessage = (e: MessageEvent) => {
      const msg = JSON.parse(e.data as string)
      switch (msg.type) {
        case 'joined':
          localStorage.setItem(storageKey(sessionId), msg.token as string)
          setMyPlayerId(msg.playerId as string)
          setSession(msg.session as SessionView)
          setConnPhase('connected')
          break
        case 'session-state':
          setSession(msg.session as SessionView)
          break
        case 'error':
          if (msg.code === 'TOKEN_NOT_FOUND') {
            localStorage.removeItem(storageKey(sessionId))
            setConnPhase('naming')
          } else if (msg.code === 'NAME_REQUIRED') {
            setConnPhase('naming')
          } else if (msg.code === 'SESSION_NOT_FOUND') {
            setConnPhase('error')
            setError('Session not found. It may have expired.')
          } else {
            setConnPhase('error')
            setError(msg.message as string)
          }
          break
        case 'session-ended':
          setConnPhase('ended')
          break
        case 'kicked':
          localStorage.removeItem(storageKey(sessionId))
          setConnPhase('kicked')
          break
      }
    }

    ws.onerror = () => {
      setConnPhase('error')
      setError('Connection failed. Please check your network and try again.')
    }
  }, [sessionId, hostToken])

  useEffect(() => {
    const token = localStorage.getItem(storageKey(sessionId))
    if (token) {
      connect(token)
    } else {
      setConnPhase('naming')
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [sessionId, connect])

  const joinWithName = useCallback((name: string) => {
    setConnPhase('connecting')
    connect(undefined, name)
  }, [connect])

  const vote = useCallback((value: number) => {
    wsRef.current?.send(JSON.stringify({ type: 'vote', value }))
  }, [])

  const reveal = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'reveal' }))
  }, [])

  const setTicket = useCallback((ticket: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'set-ticket', ticket }))
  }, [])

  const nextRound = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'next-round' }))
  }, [])

  const kick = useCallback((targetId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'kick', targetId }))
  }, [])

  return { connPhase, session, myPlayerId, error, joinWithName, vote, reveal, setTicket, nextRound, kick }
}
