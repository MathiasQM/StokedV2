<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Chart,
  type Plugin,
  type ActiveElement,
  type ScriptableContext,
} from 'chart.js/auto'
import { useIsMobile } from '@/composables/useIsMobile'
import ShinyButton from '~/components/Custom/Buttons/Shiny.vue'

import type { HistoricalQuote } from '~~/types/eodhd'
import { useTrendAnimation } from '@/composables/charts/useTrendAnimation'
import { useLineChartConfig } from '~/composables/charts/useLineChartConfig'

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
  (e: 'rangeSelected', range: { start: any; end: any } | null): void
}>()

/* ─────────────── refs & state ─────────────── */
const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const dragStartX = ref<number | null>(null)
const currentX = ref<number | null>(null)
const isInteracting = ref(false)
const isSelectionMode = ref(false)
const isMobile = useIsMobile()

// Track selected indices for segment styling
const selectionIndices = ref<{ start: number; end: number } | null>(null)

/* ─────────── pointer interaction ─────────── */
function getChartDataAtX(x: number) {
  if (!chartInstance) return null
  const scale = chartInstance.scales?.x
  if (!scale) return null

  const value = scale.getValueForPixel(x)
  if (value === undefined) return null

  // Find closest data point
  const datasets = chartInstance.data.datasets
  if (!datasets || !datasets.length) return null
  const data = datasets[0]?.data as any[]
  if (!data) return null

  // Find index with closest x value
  let closestIndex = -1
  let minDiff = Infinity

  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    if (!d) continue
    const diff = Math.abs(d.x - value)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }

  if (closestIndex === -1) return null

  return {
    index: closestIndex,
    value: data[closestIndex],
    date: chartInstance.data.labels?.[closestIndex],
    rawQuote: (data[closestIndex] as any).rawQuote,
  }
}

function handlePointerDown(e: PointerEvent) {
  // If mobile and not in selection mode, do nothing (let chart.js handle it)
  if (isMobile.value && !isSelectionMode.value) return

  const rect = (e.target as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left

  dragStartX.value = x
  currentX.value = x
  isInteracting.value = true

  // Clear previous selection on new click
  selectionIndices.value = null
  emit('rangeSelected', null)
  chartInstance?.update()
}

function handlePointerMove(e: PointerEvent) {
  if (isInteracting.value && dragStartX.value !== null) {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    currentX.value = x

    // Update selection indices for live preview
    const startData = getChartDataAtX(Math.min(dragStartX.value, x))
    const endData = getChartDataAtX(Math.max(dragStartX.value, x))

    if (startData && endData) {
      selectionIndices.value = { start: startData.index, end: endData.index }
      chartInstance?.update()
    }
  }
}

function handlePointerUp(e: PointerEvent) {
  if (
    isInteracting.value &&
    dragStartX.value !== null &&
    currentX.value !== null
  ) {
    const startX = dragStartX.value
    const endX = currentX.value

    // If drag is small, treat as click (clear selection)
    if (Math.abs(endX - startX) < 5) {
      emit('rangeSelected', null)
      selectionIndices.value = null
      dragStartX.value = null
      currentX.value = null
      chartInstance?.update()
    } else {
      // Finalize selection
      const startData = getChartDataAtX(Math.min(startX, endX))
      const endData = getChartDataAtX(Math.max(startX, endX))

      if (startData && endData) {
        selectionIndices.value = { start: startData.index, end: endData.index }
        emit('rangeSelected', { start: startData, end: endData })
        chartInstance?.update()
      }
    }
  }
  isInteracting.value = false
}

function handlePointerLeave() {
  if (isInteracting.value) {
    isInteracting.value = false
  }
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
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

function buildChart() {
  if (!canvasRef.value) return

  // Ensure any existing chart is gone
  destroyChart()

  const ui = useLineChartConfig(props.data)

  // Pre-calculate gradients
  let gradientNormal: CanvasGradient | null = null
  let gradientFaded: CanvasGradient | null = null

  /* one‑time gradient plugin */
  const gradientOnce: Plugin<'line'> = {
    id: 'gradientOnce',
    afterLayout(chart) {
      const ds = chart.data.datasets[0] as any
      if (!ds || ds._gradientApplied) return

      const { ctx, chartArea } = chart
      const col = ui.trendColors.value.line

      // Normal Gradient
      gradientNormal = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom,
      )
      gradientNormal.addColorStop(0.0, withAlpha(col, 0.4))
      gradientNormal.addColorStop(0.5, withAlpha(col, 0.2))
      gradientNormal.addColorStop(1.0, withAlpha(col, 0.0))

      // Faded Gradient (lower opacity)
      gradientFaded = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom,
      )
      gradientFaded.addColorStop(0.0, withAlpha(col, 0.1)) // Faded
      gradientFaded.addColorStop(0.5, withAlpha(col, 0.05))
      gradientFaded.addColorStop(1.0, withAlpha(col, 0.0))

      ds.backgroundColor = gradientNormal
      ds._gradientApplied = true
    },
  }

  // Filter valid plugins
  const safePlugins = (props.plugins ?? []).filter((p) => p && (p as any).id)

  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: ui.chartData.value,
    options: ui.chartOptions.value,
    plugins: [...safePlugins, gradientOnce],
  })

  /* dataset augmentation (segment fade, tension, etc.) */
  const ds = chartInstance.data.datasets[0] as any
  if (ds) {
    ds.segment = {
      borderColor(ctx: ScriptableContext<'line'>) {
        const i = (ctx as any).p0DataIndex

        // Selection logic (High Priority)
        if (selectionIndices.value) {
          if (
            i < selectionIndices.value.start ||
            i >= selectionIndices.value.end
          ) {
            return withAlpha(ui.trendColors.value.line, 0.2) // Faded line
          }
        }

        // Trend animation logic
        const win = 100
        if (ds.opaqueIndex !== undefined) {
          if (i > ds.opaqueIndex || i <= ds.opaqueIndex - win) {
            return ui.trendColors.value.lineOpacity
          }
        }

        return ui.trendColors.value.line
      },
      backgroundColor(ctx: ScriptableContext<'line'>) {
        // Selection logic for fill
        if (selectionIndices.value) {
          const i = (ctx as any).p0DataIndex
          if (
            i < selectionIndices.value.start ||
            i >= selectionIndices.value.end
          ) {
            return gradientFaded || ui.trendColors.value.fill
          }
        }
        return gradientNormal || ui.trendColors.value.fill
      },
    }
    ds.pointRadius = 0
    ds.tension = 0.25
    ds.fill = true
    ds.finalColor = ui.trendColors.value.line
    ds.borderColor = ui.trendColors.value.fill
    ds.backgroundColor = ui.trendColors.value.fill
  }

  /* hover extraction */
  const readPoints = (e: Event) => {
    if (!chartInstance) return []
    // If selecting, don't emit hover data
    if (isInteracting.value) return []

    const els = chartInstance.getElementsAtEventForMode(
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
  cvs.addEventListener('pointermove', (e) => {
    if (!isInteracting.value && (!isMobile.value || !isSelectionMode.value)) {
      emitPoints(e)
    }
  })
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
    class="relative h-72 touch-none select-none"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @pointerleave="handlePointerLeave"
  >
    <canvas ref="canvasRef" />

    <!-- Mobile Toggle Button -->
    <div
      v-if="isMobile"
      class="absolute top-2 right-2 z-10"
      @click.stop
      @pointerdown.stop
    >
      <ShinyButton variant="circle" @click="isSelectionMode = !isSelectionMode">
        <template #icon>
          <UIcon
            name="i-lucide-scan"
            class="w-4 h-4 transition-colors"
            :class="isSelectionMode ? 'text-orange-500' : 'text-white/60'"
          />
        </template>
      </ShinyButton>
    </div>
  </div>
</template>
