<script setup lang="ts">
import { defineProps } from 'vue'
import { POSITIVE, NEGATIVE } from '~~/constants'
import { useChartUI } from '~/composables/charts/useChartUi'
import type { HistoricalQuote } from '~~/types/eodhd'
import { useMarketStore } from '~~/stores/market/useMarketStore'

const props = withDefaults(
  defineProps<{
    purpose?: 'ticker' | 'chartTooltip'
    symbol: string
    quoteData: HistoricalQuote[]
    hoverData?: any
  }>(),
  { purpose: 'ticker' },
)

const { selectedRange } = storeToRefs(useMarketStore())

const computedDateFormat = computed(() => {
  switch (selectedRange.value) {
    case '1d':
      return 'MMM DD HH:mm'
    case '1w':
      return 'MMM DD'
    case '1m':
      return 'MMM DD'
    case '3m':
      return 'MMM DD'
    case '6m':
      return 'MMM DD'
    case '1y':
      return 'MMM DD'
    case 'max':
      return 'MMM DD'
    default:
      return 'MM DD'
  }
})

const { trendColors, isPositive } = useChartUI(
  !props.hoverData ? props.quoteData : props.hoverData,
)

const localIsPositive = computed(() => {
  if (!props.hoverData) return isPositive.value

  const data = props.quoteData
  if (!data || data.length < 2) return true
  const first = Number(data?.[0]?.adjusted_close)
  const last = Number(props.hoverData.value.y)
  return last - first >= 0
})

const localTrendColors = computed(() => {
  if (!props.hoverData) return trendColors.value

  return localIsPositive.value ? POSITIVE : NEGATIVE
})

const computeDifference = computed(() => {
  const first = Number(props.quoteData?.[0]?.adjusted_close ?? 0)

  const last = Number(
    props.hoverData
      ? props.hoverData.value.y
      : (props.quoteData?.[props.quoteData.length - 1]?.adjusted_close ?? 0),
  )

  const change = last - first
  const change_p = first ? (change / first) * 100 : 0

  return {
    change: change.toFixed(2),
    change_p: change_p.toFixed(2),
  }
})
</script>

<template>
  <div class="space-y-2">
    <span class="block h-8 w-8 bg-white rounded-full"></span>
    <p class="text-black-100 text-lg font-bold">
      {{
        purpose === 'ticker' && !hoverData
          ? symbol
          : useDateFormat(hoverData?.date, `${computedDateFormat} YYYY`)
      }}
    </p>

    <p class="text-black-50 mb-2 text-4xl font-semibold tracking-wide">
      ${{
        purpose === 'ticker' && !hoverData
          ? quoteData?.[quoteData.length - 1]?.close?.toFixed(2)
          : hoverData?.value?.y.toFixed(2)
      }}
    </p>
    <div class="flex max-w-48 items-center justify-start gap-2 font-medium">
      <div
        :style="{
          backgroundColor: `${localTrendColors?.line}1A`,
        }"
        class="flex aspect-square h-5 w-5 items-center justify-center rounded-sm"
      >
        <UIcon
          :name="`i-lucide-trending-${localIsPositive ? 'up' : 'down'}`"
          class="size-3"
          :style="{
            color: `${localTrendColors?.line}`,
          }"
        />
      </div>
      <p
        class="text-sm tracking-wide"
        :style="{
          color: `${localTrendColors?.line}`,
        }"
      >
        {{ computeDifference.change_p }}%
      </p>
      <p
        class="text-sm tracking-wide"
        :style="{
          color: `${localTrendColors?.line}`,
        }"
      >
        ${{ computeDifference.change }}
      </p>
      <p
        v-if="!hoverData"
        class="text-black-400 text-sm tracking-wide whitespace-nowrap"
      >
        {{ useDateFormat(quoteData?.timestamp) }}
      </p>
    </div>

    <p
      v-if="purpose === 'chartTooltip' || hoverData"
      class="absolute mt-4 text-xs tracking-wide"
    >
      Vol
      <span class="font-bold">{{
        hoverData?.value?.volume?.toLocaleString()
      }}</span>
      High
      <span class="font-bold">{{
        hoverData?.value?.high?.toLocaleString()
      }}</span>
      Low
      <span class="font-bold">{{
        hoverData?.value?.low?.toLocaleString()
      }}</span>
    </p>
  </div>
</template>

<style scoped>
.dotted-round-background {
  position: absolute;
  top: -70px;
  left: -70px;
  width: 250px;
  height: 250px;
  overflow: hidden;
  z-index: -10;
  /* Place behind chart */
}

.dotted-round-background::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 0;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  /* make it a circle */
  background: radial-gradient(circle, rgb(140, 140, 140) 1px, transparent 1px);
  background-size: 10px 10px;
  background-position: 0 0;
  /* start dots from top-left */

  mask-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.6) 30%,
    rgba(255, 255, 255, 0.3) 60%,
    rgba(255, 255, 255, 0) 80%,
    rgba(255, 255, 255, 0) 900%
  );
  -webkit-mask-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.6) 30%,
    rgba(255, 255, 255, 0.3) 60%,
    rgba(255, 255, 255, 0) 80%,
    rgba(255, 255, 255, 0) 900%
  );
}
</style>
