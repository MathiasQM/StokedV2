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
const { fetchFullHistory, getFromDate, fullHistoricalQuotesCache } =
  useMarketQuote()

const { status } = await useAsyncData(
  `history-${props.symbol}`,
  () => fetchFullHistory(props.symbol),
  {
    watch: [() => props.symbol],
    lazy: true,
  },
)

const quoteData = computed(
  (): HistoricalQuote[] =>
    fullHistoricalQuotesCache.value[props.symbol]?.filter((q) =>
      dayjs(q.date).isAfter(getFromDate(selectedRange.value)),
    ) ?? [],
)

const slotProps = reactive({
  quoteData,
  isLoading: computed(() => status.value === 'pending'),
})
</script>

<template>
  <div>
    <main class="relative">
      <slot v-bind="slotProps" />
    </main>
  </div>
</template>
