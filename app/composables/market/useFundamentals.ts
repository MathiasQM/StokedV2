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
  const {
    stockFundamentals,
    pending: storePending,
    errors: storeErrors,
  } = storeToRefs(store)

  const symbols = computed<string[]>(() => unref(opts.symbols) ?? [])
  const filter = computed<string>(() => unref(opts.filter) || 'General')
  const maxAgeMs = computed(() => opts.maxAgeMs ?? 10 * 60_000)

  const unique = computed(() =>
    Array.from(new Set(unref(symbols))).filter(Boolean),
  )

  const fundamentalsMap = computed<Record<string, any>>(() => {
    const out: Record<string, any> = {}
    const storeData = stockFundamentals.value
    const section = filter.value

    for (const k of unique.value) {
      out[k] = storeData[k]?.[section]?.data
    }
    return out
  })

  const anyPending = computed(() => {
    const pendingSet = storePending.value
    const section = filter.value
    return unique.value.some((k) => pendingSet.has(`${k}:${section}`))
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
    const section = filter.value
    // We don't have a batch fetch anymore, so we fetch individually.
    // This might be less efficient for large lists but aligns with the new granular store.
    // Ideally, the API would support batching with filters, but for now we loop.
    await Promise.all(
      unique.value.map((symbol) => store.fetchStockSection(symbol, section)),
    )
  }

  watch(
    [unique, filter, maxAgeMs],
    () => {
      if (unique.value.length) {
        refresh(false)
      }
    },
    { immediate: true },
  )

  return { fundamentalsMap, pending: anyPending, errors, refresh }
}
