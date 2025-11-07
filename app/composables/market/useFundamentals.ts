import {
  useFundamentalsStore,
  type FundamentalsError,
} from '@@/stores/fundamentals'
import { storeToRefs } from 'pinia'
import { computed, unref, watch } from 'vue'
import type { MaybeRef } from 'vue'

type Opts = {
  symbols: MaybeRef<string[]>
  filter?: MaybeRef<string | undefined>
  maxAgeMs?: number
  version?: string
}

/**
 * Handles arrays of symbols, perfect for lists or batch operations.
 */
export function useFundamentals(opts: Opts) {
  const store = useFundamentalsStore()

  const { byKey, pending, errors: storeErrors } = storeToRefs(store)

  const symbols = computed<string[]>(() => unref(opts.symbols) ?? [])
  const filter = computed<string | undefined>(() => unref(opts.filter))
  const maxAgeMs = computed(() => opts.maxAgeMs ?? 10 * 60_000)

  const unique = computed(() =>
    Array.from(new Set(unref(symbols))).filter(Boolean),
  )

  const fundamentalsMap = computed<Record<string, any>>(() => {
    const out: Record<string, any> = {}
    const storeData = byKey.value

    for (const k of unique.value) {
      out[k] = storeData[k]?.data
    }
    return out
  })

  const anyPending = computed(() => {
    const pendingSet = pending.value
    return unique.value.some((k) => pendingSet.has(k))
  })

  const errors = computed(() => {
    const out: Record<string, FundamentalsError | null> = {}
    const errorsData = storeErrors.value
    for (const k of unique.value) {
      out[k] = errorsData[k] ?? null
    }
    return out
  })

  async function refresh(force = false) {
    await store.fetchMany(unique.value, {
      filter: unref(filter),
      force,
      maxAgeMs: maxAgeMs.value,
      version: opts.version,
    })
  }

  watch(
    [unique, filter, maxAgeMs],
    () => {
      refresh(false)
    },
    { immediate: true },
  )

  return { fundamentalsMap, pending: anyPending, errors, refresh }
}
