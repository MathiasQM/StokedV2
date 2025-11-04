<template>
  <div
    class="rounded-2xl p-[1px] gradient backdrop-blur text-white overflow-hidden"
  >
    <div class="bg-black/85 rounded-2xl">
      <!-- <div class="px-4 pt-3 pb-2">
        <p class="text-xs text-neutral-400">{{ titleText }}</p>
        <div class="mt-1 flex items-baseline gap-2">
          <p class="text-2xl font-semibold tracking-tight">
            {{ computedValueText }}
          </p>
          <p
            v-if="deltaPct !== undefined"
            :class="deltaPct >= 0 ? 'text-emerald-400' : 'text-red-400'"
            class="text-sm font-medium"
          >
            {{ deltaPct >= 0 ? '+' : '' }}{{ formatPct(deltaPct) }}
          </p>
        </div>
      </div>

      <div class="h-px bg-white/10"></div> -->

      <div class="px-4 py-3" v-if="normalizedSegments.length">
        <div class="mb-2 grid grid-cols-3 gap-2 text-xs">
          <div
            v-for="(s, i) in normalizedSegments"
            :key="'lbl-' + i"
            class="flex flex-col"
          >
            <span
              class="text-neutral-400 uppercase font-medium"
              :class="
                i === 1 ? 'text-center' : i === 2 ? 'text-right' : 'text-left'
              "
              >{{ s.label }}</span
            >
          </div>
        </div>
        <div class="flex items-stretch gap-2">
          <div
            v-for="(s, i) in normalizedSegments"
            :key="i"
            class="h-1 rounded-full overflow-hidden"
            :style="{ flex: String(s.weight) + ' 0 0' }"
          >
            <div
              class="h-full w-full rounded-full"
              :style="{
                background: s.to
                  ? `linear-gradient(90deg, ${s.from}, ${s.to})`
                  : s.from,
              }"
            />
          </div>
        </div>

        <div class="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div
            v-for="(s, i) in normalizedSegments"
            :key="'lbl-' + i"
            class="flex flex-col"
            :class="
              i === 1 ? 'text-center' : i === 2 ? 'text-right' : 'text-left'
            "
          >
            <span class="text-white/90 font-medium"
              >{{ s.pct.toFixed(2) }}%</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Segment = { label: string; pct: number; from: string; to?: string }

type ArticleSentiment = {
  countValid: number
  countTotal: number
  coverage: number
  avg: { polarity: number; neg: number; neu: number; pos: number }
  label: string
  score: number
}

const props = defineProps<{
  /** Pass your article.sentiment here */
  sentiment?: ArticleSentiment | null
  /** Optional override title */
  title?: string
  /** Optional delta to show to the right (e.g. WoW change) */
  deltaPct?: number
  /** Fallback/manual mode: if sentiment not provided, you can pass raw segments + valueText */
  segments?: Segment[]
  valueText?: string
}>()

const titleText = computed(() => props.title ?? 'Sentiment')

/** Build segments from sentiment if present, else use manual props.segments */
const segmentsFromSentiment = computed<Segment[]>(() => {
  const s = props.sentiment?.avg
  if (!s) return []
  return [
    { label: 'Bear', pct: s.neg * 100, from: '#dd213b' }, // red-500
    { label: 'Neutral', pct: s.neu * 100, from: '#4e74ff' }, // blue-500
    { label: 'Bull', pct: s.pos * 100, from: '#07b25f' }, // emerald-500
  ]
})

const segments = computed<Segment[]>(() =>
  segmentsFromSentiment.value.length
    ? segmentsFromSentiment.value
    : (props.segments ?? []),
)

/** Use segment pct as flex-grow weights (proportional widths) */
const normalizedSegments = computed(() =>
  segments.value.map((s) => ({
    ...s,
    pct: Math.max(0, s.pct),
    weight: Math.max(0, s.pct),
  })),
)

/** Value text: from sentiment -> "Bullish +58.2%" (polarity -1..1), else fallback prop */
const computedValueText = computed(() => {
  if (props.sentiment) {
    const p = props.sentiment.avg.polarity
    const signed = (p * 100).toFixed(1) + '%'
    const sign = p > 0 ? '+' : '' // keep minus for negatives
    return `${props.sentiment.label} ${sign}${signed}`
  }
  return props.valueText ?? ''
})

const deltaPct = toRef(props, 'deltaPct')

function formatPct(n: number) {
  return `${n.toFixed(1)}%`
}
</script>

<style scoped>
.gradient {
  background: linear-gradient(
    130deg,
    rgba(150, 150, 150, 0.3) 20%,
    rgba(150, 150, 150, 0.7) 40%,
    rgba(150, 150, 150, 0.8) 50%,
    rgba(150, 150, 150, 0.8) 60%,
    rgba(150, 150, 150, 0.7) 70%,
    rgba(150, 150, 150, 0.3) 90%
  );
}
</style>
