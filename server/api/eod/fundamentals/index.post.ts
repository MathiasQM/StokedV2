import { z } from 'zod'

const Body = z.object({
  symbols: z.array(z.string().min(1)).min(1),
  filter: z.string().optional(), // e.g. "General::Code" or "Financials::Balance_Sheet::yearly"
  version: z.string().optional(), // optional: &version=1.2 if you need legacy-like shape
})

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const apiKey = cfg.eodFundamentalsApiKey
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing api key',
    })
  }

  const body = await readBody(event)
  const { symbols, filter, version } = Body.parse(body)

  const maxConcurrency = 4
  const queue: Promise<any>[] = []
  const results: { key: string; data: any }[] = []

  async function fetchOne(symbol: string) {
    const base = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}`
    const q = new URLSearchParams({ api_token: apiKey, fmt: 'json' })
    if (filter) q.set('filter', filter) // EODHD supports multi-layer filter via '::' to go deeper into the object
    if (version) q.set('version', version)
    const url = `${base}?${q.toString()}`

    const data = await $fetch<any>(url, { method: 'GET' })
    return { key: symbol, data }
  }

  for (const s of symbols) {
    const p = fetchOne(s).then((r) => {
      results.push(r)
    })
    queue.push(p)
    if (queue.length >= maxConcurrency) {
      await Promise.race(queue)
      // remove settled promises
      for (let i = queue.length - 1; i >= 0; i--) {
        if (
          Reflect.get(queue[i], 'status') === 'fulfilled' ||
          Reflect.get(queue[i], 'status') === 'rejected'
        ) {
          queue.splice(i, 1)
        }
      }
    }
  }
  await Promise.allSettled(queue)

  return results
})
