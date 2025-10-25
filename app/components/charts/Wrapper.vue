<script setup lang="ts">
import dayjs from 'dayjs'
import { useMarketQuote } from '~/composables/market/useMarketQuote'
import { useMarketStore } from '~~/stores/market/useMarketStore'
import type { HistoricalQuote } from '~~/types/eodhd'

const props = withDefaults(
  defineProps<{
    symbol: string
  }>(),
  { symbol: '' },
)

const { selectedRange } = storeToRefs(useMarketStore())

const { fetchFullHistory } = useMarketQuote()
await fetchFullHistory(props.symbol)

const { fullHistoricalQuotesCache } = useMarketQuote()
const quoteData = computed(
  (): HistoricalQuote[] =>
    fullHistoricalQuotesCache.value[props.symbol]?.filter((q) =>
      dayjs(q.date).isAfter(useMarketQuote().getFromDate(selectedRange.value)),
    ) ?? [],
)

const slotProps = reactive({
  quoteData,
})
</script>

<template>
  <div>
    <main class="relative">
      <slot v-bind="slotProps" />
    </main>
  </div>
</template>
