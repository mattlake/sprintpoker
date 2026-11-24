# ---- build client ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci
COPY client/ ./client/
RUN npm run build -w client

# ---- production image ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --omit=dev
COPY server/ ./server/
COPY --from=build /app/client/dist ./client/dist
EXPOSE 3001
CMD ["node_modules/.bin/tsx", "server/src/index.ts"]
