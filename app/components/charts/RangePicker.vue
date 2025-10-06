<script setup lang="ts">
import { ranges } from '~~/constants'
import dayjs from 'dayjs'
import { useMarketStore, type DataRange } from '@@/stores/market/useMarketStore'

interface Move {
  range: DataRange
  pct: number
}

const props = defineProps<{
  symbol: string
  data: any
}>()

const { selectedRange } = storeToRefs(useMarketStore())

function startDateForRange(range: string, lastDate: dayjs.Dayjs) {
  if (range === 'max') return dayjs(props.data[0].date)
  if (range === 'ytd') return lastDate.startOf('year')

  const [, n, u] = range.match(/^(\d+)([dwmy])$/i) ?? []
  const unitMap: Record<string, dayjs.ManipulateType> = {
    d: 'day',
    w: 'week',
    m: 'month',
    y: 'year',
  }
  return lastDate.subtract(Number(n), unitMap[u])
}

const rangeMoves = computed<Move[]>(() => {
  if (!props.data.length) return []

  const latestIdx = props.data.length - 1
  const latestQuote = props.data[latestIdx]
  const latestClose = latestQuote.adjusted_close
  const latestDayjs = dayjs(latestQuote.date)

  return ranges.map((r) => {
    const start = startDateForRange(r, latestDayjs)

    // first candle *on/after* the start date
    const firstIdx = props.data.findIndex(
      (q) => dayjs(q.date).isSame(start, 'day') || dayjs(q.date).isAfter(start),
    )
    const firstClose =
      firstIdx === -1
        ? props.data[0].adjusted_close
        : props.data[firstIdx].adjusted_close

    const pct = ((latestClose - firstClose) / firstClose) * 100
    return { range: r, pct }
  })
})

const handleSelectRange = (range: DataRange) => {
  if (selectedRange.value === range) return
  selectedRange.value = range
}
</script>

<template>
  <div
    class="bg-black-950 flex w-full items-start justify-start gap-2 overflow-auto overflow-x-scroll px-3 pt-2 pb-2 sm:justify-center"
  >
    <div
      v-for="r in rangeMoves"
      :key="r.range"
      class="flex h-10 w-16 flex-col items-center justify-center rounded-sm p-1 text-sm text-white transition-all"
      :class="[{ 'bg-black-800': r.range === selectedRange }]"
      @click="handleSelectRange(r.range)"
    >
      <p class="text-xs font-semibold">{{ r.range }}</p>
      <p
        class="text-xs font-semibold"
        :class="r.pct > 0 ? 'text-green-500' : 'text-red-500'"
      >
        {{ r.pct.toFixed(2) ?? 0 }}%
      </p>
    </div>
  </div>
</template>
