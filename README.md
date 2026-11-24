# Sprint Poker

Lightweight planning poker for sprint estimation. No accounts, no database — share a link and vote.

## How it works

1. Click **Start Session** to get a host URL and a participant URL. Keep the host URL to yourself — it's what gives you host controls.
2. Share the participant URL with your team.
3. Everyone picks a Fibonacci card (1, 2, 3, 5, 8, 13). Cards stay face down until the host clicks **Reveal Hand**.
4. The host can set a ticket label, kick players, and start the next round with **Another round?**.
5. If you're screen sharing as host, tick **Presenter Mode** when entering your name so your card selection isn't visible to viewers.
6. If the host disconnects and doesn't return within 30 seconds, the session ends for everyone. Idle sessions are cleaned up after 4 hours. Nothing is persisted to disk.

## Requirements

Node.js 20 or later.

## Local development

```bash
npm install
npm run dev
```

The client runs on `http://localhost:5173` (Vite) and proxies API/WebSocket requests to the server on `http://localhost:3001`.

To run a production build locally:

```bash
npm run build
NODE_ENV=production npm start
```

Then open `http://localhost:3001`.

## Environment variables

All are optional. They're read from the process environment (there's no `.env` loading); `.env.example` lists them with their defaults.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port the server listens on |
| `NODE_ENV` | `development` | Set to `production` to serve the built client |
| `MAX_SESSIONS` | `50` | Max concurrent sessions |
| `MAX_PLAYERS_PER_SESSION` | `20` | Max players per session |
| `SESSION_TTL_HOURS` | `4` | Hours before an idle session is cleaned up |
| `HOST_GRACE_PERIOD_SECONDS` | `30` | Seconds before a session ends when the host disconnects |

## Docker

```bash
docker build -t sprintpoker .
docker run -p 3001:3001 sprintpoker
```

Open `http://localhost:3001`.

Pass environment variables with `-e` (or `--env-file`):

```bash
docker run -p 3001:3001 \
  -e MAX_SESSIONS=100 \
  -e SESSION_TTL_HOURS=8 \
  sprintpoker
```

## Deploy

Any host that can run a Docker container and supports WebSockets will work. Two examples:

### Fly.io

```bash
fly launch --no-deploy
fly deploy
```

`fly launch` asks for an app name and generates a `fly.toml`. It picks up the Dockerfile and sets the internal port to 3001 from its `EXPOSE` line. To override limits:

```bash
fly secrets set MAX_SESSIONS=100 SESSION_TTL_HOURS=8
```

### Railway

1. Push the repo to GitHub.
2. Create a new Railway project → **Deploy from GitHub repo**.
3. Railway detects the `Dockerfile` and builds it.
4. Set env vars under **Variables** in the Railway dashboard if you need non-default limits.
5. Railway exposes the app on a public HTTPS URL with WebSocket support enabled by default.
