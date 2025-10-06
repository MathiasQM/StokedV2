import { defineEventHandler, getHeader } from 'h3'

const WINDOW_MS = 60_000
const MAX = 60

const bucket = new Map<string, { ts: number; n: number }>()

export default defineEventHandler((event) => {
  const ip =
    getHeader(event, 'x-forwarded-for') ||
    event.node.req.socket.remoteAddress ||
    'anon'
  const now = Date.now()
  const b = bucket.get(ip) ?? { ts: now, n: 0 }

  // reset window
  if (now - b.ts > WINDOW_MS) {
    b.ts = now
    b.n = 0
  }

  b.n++
  bucket.set(ip, b)

  if (b.n > MAX) {
    throw createError({ statusCode: 429, statusMessage: 'Slow down' })
  }
})
