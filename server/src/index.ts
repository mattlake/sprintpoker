import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { randomUUID } from 'crypto'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { sessionStore } from './sessions.js'
import { setupWebSocketServer } from './ws.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = Fastify({ logger: { level: 'info' } })

app.post('/api/sessions', async (req, reply) => {
  const hostToken = randomUUID()
  let session
  try {
    session = sessionStore.create(hostToken)
  } catch {
    return reply.status(503).send({ error: 'Server is at capacity. Please try again later.' })
  }

  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'http'
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? 'localhost:3001'
  const base = `${proto}://${host}`

  return {
    sessionId: session.id,
    participantUrl: `${base}/s/${session.id}`,
    hostUrl: `${base}/s/${session.id}/host/${hostToken}`,
  }
})

if (process.env.NODE_ENV === 'production') {
  const distPath = resolve(__dirname, '../../client/dist')
  await app.register(fastifyStatic, { root: distPath, wildcard: false })

  app.setNotFoundHandler(async (req, reply) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/ws')) {
      return reply.status(404).send({ error: 'Not found' })
    }

    // Validate host URL token before serving the app
    const hostMatch = req.url.match(/^\/s\/([^/?]+)\/host\/([^/?]+)/)
    if (hostMatch) {
      const [, sessionId, hostToken] = hostMatch
      const session = sessionStore.get(sessionId)
      if (!session || session.hostToken !== hostToken) {
        return reply.status(404).send('Not found')
      }
    }

    return reply.sendFile('index.html')
  })
}

sessionStore.startCleanup()

await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' })
setupWebSocketServer(app.server)
