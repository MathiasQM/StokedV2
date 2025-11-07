import { defineStore } from 'pinia'

export type FundamentalsEntry = {
  updatedAt: number
  data: any
}

export type FundamentalsError = {
  message: string
  statusCode?: number | null
  statusMessage?: string | null
}

export const useFundamentalsStore = defineStore('fundamentals', () => {
  const byKey = ref<Record<string, FundamentalsEntry>>({})

  const errors = ref<Record<string, FundamentalsError | null>>({})

  function get(key: string) {
    return byKey.value[key]?.data
  }

  function isFresh(key: string, maxAgeMs: number) {
    const t = byKey.value[key]?.updatedAt ?? 0
    return Date.now() - t < maxAgeMs
  }

  async function fetchMany(
    symbols: string[],
    opts?: {
      filter?: string
      force?: boolean
      maxAgeMs?: number
      version?: string
    },
  ) {
    const {
      filter,
      force = false,
      maxAgeMs = 10 * 60_000,
      version,
    } = opts || {}

    const need = symbols
      .filter(Boolean)
      .filter((s) => (force ? true : !isFresh(s, maxAgeMs)))

    if (!need.length) return

    try {
      const res = await $fetch<{ key: string; data: any }[]>(
        '/api/eod/fundamentals',
        {
          method: 'POST',
          body: { symbols: need, filter, version },
        },
      )

      for (const { key, data } of res) {
        byKey.value[key] = { data, updatedAt: Date.now() }
        errors.value[key] = null
      }
    } catch (e: any) {
      const serializableError: FundamentalsError = {
        message: e.message || 'An unknown error occurred',
        statusCode: e.statusCode || null,
        statusMessage: e.statusMessage || null,
      }
      need.forEach((k) => (errors.value[k] = serializableError))
    }
  }

  function clear(key?: string) {
    if (key) {
      delete byKey.value[key]
      delete errors.value[key]
    } else {
      byKey.value = {}
      errors.value = {}
    }
  }

  return { byKey, errors, get, fetchMany, clear }
})
