<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { Chart, type ChartOptions } from 'chart.js/auto'

const props = withDefaults(
  defineProps<{
    data: { label: string; value: number; date?: string }[]
    color?: string
    options?: ChartOptions<'bar'>
    showValues?: boolean
    isPercent?: boolean
    showLegend?: boolean
    showYAxis?: boolean
  }>(),
  {
    color: '#f97316', // orange-500
    options: () => ({}),
    showValues: false,
    isPercent: false,
    showLegend: false,
    showYAxis: false,
  },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const buildChart = () => {
  if (!canvasRef.value) return

  const existing = Chart.getChart(canvasRef.value)
  if (existing) existing.destroy()

  const plugins = []

  if (props.showValues) {
    plugins.push({
      id: 'valuesOnTop',
      afterDatasetsDraw(chart: any) {
        const { ctx } = chart
        chart.data.datasets.forEach((dataset: any, i: number) => {
          const meta = chart.getDatasetMeta(i)
          meta.data.forEach((bar: any, index: number) => {
            const value = dataset.data[index]
            const isNegative = value < 0

            ctx.save()
            ctx.fillStyle = '#9ca3af' // text-gray-400
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = isNegative ? 'top' : 'bottom'

            // Format value
            let formatted
            if (props.isPercent) {
              formatted = new Intl.NumberFormat('en-US', {
                style: 'percent',
                maximumFractionDigits: 0, // 0.22 -> 22%
              }).format(value)
            } else {
              formatted = new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(value)
            }

            // Position above/below bar with some padding
            const yPos = isNegative ? bar.y + 5 : bar.y - 5

            ctx.fillText(formatted, bar.x, yPos)
            ctx.restore()
          })
        })
      },
    })
  }

  chartInstance = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.data.map((d) => d.label),
      datasets: [
        {
          data: props.data.map((d) => d.value),
          backgroundColor: props.color,
          borderRadius: 2,
          barThickness: 'flex',
          maxBarThickness: 30,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: props.showLegend },
        tooltip: { enabled: false },
      },
      events: [],
      scales: {
        x: { display: false },
        y: {
          display: false,
        },
      },
    },
    plugins,
  })
}

const destroyChart = () => {
  chartInstance?.destroy()
  chartInstance = null
}

onMounted(buildChart)
onUnmounted(destroyChart)

watch(
  () => props,
  async () => {
    destroyChart()
    await nextTick()
    buildChart()
  },
  { deep: true },
)
</script>

<template>
  <div class="relative w-full h-full">
    <canvas ref="canvasRef" />
  </div>
</template>
