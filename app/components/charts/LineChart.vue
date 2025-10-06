<!-- components/charts/LineChart.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Chart, type Plugin, type ActiveElement } from 'chart.js/auto'

import type { HistoricalQuote } from '~~/types/eodhd'
import { useTrendAnimation } from '@/composables/charts/useTrendAnimation'
import { useChartUI } from '~/composables/charts/useChartUi'

/* ─────────────── props / emits ─────────────── */
const props = withDefaults(
  defineProps<{
    data: HistoricalQuote[]
    plugins?: Plugin[]
  }>(),
  { plugins: () => [] },
)

const emit = defineEmits<{
  (e: 'hoveredData', points: any[]): void
}>()

/* keep only valid Chart.js plugins */
const safePlugins = computed(() =>
  (props.plugins ?? []).filter((p) => p && (p as any).id),
)

/* ─────────────── refs & state ─────────────── */
const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const dragStartY = ref<number | null>(null)
const isInteracting = ref(false)

/* ─────────── pointer interaction ─────────── */
function handlePointerDown(e: PointerEvent) {
  dragStartY.value = e.clientY
  isInteracting.value = true
}
function handlePointerMove(e: PointerEvent) {
  if (dragStartY.value !== null && Math.abs(e.clientY - dragStartY.value) >= 5)
    isInteracting.value = true
}
function handlePointerUp() {
  dragStartY.value = null
  isInteracting.value = false
}

/* ─────────── colour util ─────────── */
function withAlpha(base: string, a: number) {
  if (base.startsWith('#')) {
    const r = parseInt(base.slice(1, 3), 16)
    const g = parseInt(base.slice(3, 5), 16)
    const b = parseInt(base.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  const m = base.match(/\d+/g)
  return m ? `rgba(${m[0]},${m[1]},${m[2]},${a})` : base
}

/* ─────────── Chart helpers ─────────── */
function destroyChart() {
  console.log('Destroying chart', chartInstance)
  try {
    chartInstance?.destroy()
    console.log('supposedly destroyed', chartInstance)
  } catch (e) {
    console.error('Error destroying chart:', e)
  }
  if (!chartInstance) console.error('Chart instance destroyed:', chartInstance)

  chartInstance = null
}

function buildChart() {
  if (!canvasRef.value) return

  /* cache UI helpers for this build */
  const existing = Chart.getChart(canvasRef.value)
  if (existing) {
    console.log('⚠️ Found existing chart on canvas, destroying...')
    existing.destroy()
  }

  const ui = useChartUI(props.data)

  /* one‑time gradient plugin (removed after execution) */
  const gradientOnce: Plugin<'line'> = {
    id: 'gradientOnce',
    afterLayout(chart) {
      const ds = chart.data.datasets[0] as any
      if (!ds || ds._gradientApplied) return // guard
      const { ctx, chartArea } = chart
      const col = ui.trendColors.value.fill

      const grad = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom,
      )
      grad.addColorStop(0.0, withAlpha(col, 0.4))
      grad.addColorStop(0.6, withAlpha(col, 0.3))
      grad.addColorStop(0.75, withAlpha(col, 0.2))
      grad.addColorStop(0.9, withAlpha(col, 0.1))
      grad.addColorStop(1.0, withAlpha(col, 0.0))

      ds.backgroundColor = grad
      ds._gradientApplied = true // mark so we never redo it
      // plugin keeps running but work is now O(1) no‑op
    },
  }

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: ui.chartData.value,
    options: ui.chartOptions.value,
    plugins: [...safePlugins.value, gradientOnce],
  })

  /* dataset augmentation (segment fade, tension, etc.) */
  const ds = chartInstance.data.datasets[0] as any
  ds.segment = {
    borderColor(ctx: any) {
      const win = 100
      if (ds.opaqueIndex === undefined) return ui.trendColors.value.lineOpacity
      const i = ctx.p0DataIndex
      return i <= ds.opaqueIndex && i > ds.opaqueIndex - win
        ? ui.trendColors.value.line
        : ui.trendColors.value.lineOpacity
    },
  }
  ds.pointRadius = 0
  ds.tension = 0.25
  ds.fill = true
  ds.finalColor = ui.trendColors.value.line
  ds.borderColor = ui.trendColors.value.fill
  ds.backgroundColor = ui.trendColors.value.fill

  /* hover extraction */
  const readPoints = (e: Event) => {
    const els = chartInstance!.getElementsAtEventForMode(
      e as any,
      'index',
      { intersect: false, axis: 'x' },
      false,
    ) as ActiveElement[]

    return els.map((el) => ({
      datasetIndex: el.datasetIndex,
      index: el.index,
      value: chartInstance!.data.datasets[el.datasetIndex].data[el.index],
      date: chartInstance!.data.labels?.[el.index],
    }))
  }
  const emitPoints = (e: Event) => emit('hoveredData', readPoints(e))

  const cvs = canvasRef.value
  cvs.addEventListener('pointerdown', emitPoints)
  cvs.addEventListener('pointermove', emitPoints)
  cvs.addEventListener('pointerup', emitPoints)
  cvs.addEventListener('pointercancel', emitPoints)
  cvs.addEventListener('pointerleave', () => emit('hoveredData', []))

  /* draw‑in animation */
  const { start } = useTrendAnimation(() => chartInstance!, {
    segmentSize: 100,
    interval: 20,
  })
  start()
}

/* mount / unmount */
onMounted(buildChart)
onUnmounted(destroyChart)

/* rebuild chart when data reference changes */
watch(
  () => props.data,
  async () => {
    destroyChart()
    await nextTick()
    buildChart()
  },
)
</script>

<template>
  <div
    class="relative h-72"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @pointerleave="handlePointerUp"
  >
    <canvas ref="canvasRef" />
  </div>
</template>
