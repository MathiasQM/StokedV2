// stores/fundamentals.ts
import { defineStore } from 'pinia'

export type FundamentalsEntry = {
  updatedAt: number
  data: any
}

// 1. Define a serializable error type
export type FundamentalsError = {
  message: string
  statusCode?: number | null
  statusMessage?: string | null
}

export const useFundamentalsStore = defineStore('fundamentals', () => {
  const byKey = ref<Record<string, FundamentalsEntry>>({})
  const pending = ref<Set<string>>(new Set())

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
      .filter((s) => !pending.value.has(s))

    if (!need.length) return

    need.forEach((s) => pending.value.add(s))
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
      // 3. THIS IS THE FIX:
      // Create a plain POJO from the error object
      const serializableError: FundamentalsError = {
        message: e.message || 'An unknown error occurred',
        // $fetch errors often have these properties
        statusCode: e.statusCode || null,
        statusMessage: e.statusMessage || null,
      }
      need.forEach((k) => (errors.value[k] = serializableError))
    } finally {
      need.forEach((s) => pending.value.delete(s))
    }
  }

  function clear(key?: string) {
    if (key) {
      delete byKey.value[key]
      delete errors.value[key]
    } else {
      byKey.value = {}
      errors.value = {}
      pending.value.clear()
    }
  }

  return { byKey, pending, errors, get, fetchMany, clear }
})
