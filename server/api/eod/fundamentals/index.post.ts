import { z } from 'zod'

const Body = z.object({
  symbols: z.array(z.string().min(1)).min(1),
  filter: z.string().optional(),
  version: z.string().optional(),
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
  const results: { key: string; data: any }[] = []

  // Use a Map to track active promises
  const activePromises = new Map<string, Promise<any>>()

  async function fetchOne(symbol: string) {
    const base = `https://eodhd.com/api/fundamentals/${encodeURIComponent(symbol)}`
    const q = new URLSearchParams({ api_token: apiKey, fmt: 'json' })
    if (filter) q.set('filter', filter)
    if (version) q.set('version', version)
    const url = `${base}?${q.toString()}`

    const data = await $fetch<any>(url, { method: 'GET' })
    return { key: symbol, data }
  }

  for (const s of symbols) {
    // Create the promise
    const p = fetchOne(s)
      .then((r) => {
        results.push(r)
      })
      .catch((e) => {
        console.error(`Error fetching ${s}:`, e.message)
        // Optionally, you could propagate this error back
      })
      .finally(() => {
        // When this promise settles (success or fail), remove it
        activePromises.delete(s)
      })

    // Add it to the map
    activePromises.set(s, p)

    // If we've hit the limit, wait for *any* promise to finish
    if (activePromises.size >= maxConcurrency) {
      await Promise.race(activePromises.values())
    }
  }

  // Wait for all remaining promises to complete
  await Promise.allSettled(activePromises.values())

  return results
})
