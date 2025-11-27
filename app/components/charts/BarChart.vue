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
    showYAxis: boolean
    showYAxisTicks?: boolean
    showXAxis?: boolean
    currency?: string
  }>(),
  {
    color: '#f97316', // orange-500
    options: () => ({}),
    showValues: false,
    isPercent: false,
    showLegend: false,
    showYAxis: false,
    showYAxisTicks: true,
    showXAxis: false,
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
            } else if (props.currency) {
              formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: props.currency,
                notation: 'compact',
                maximumFractionDigits: 1,
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

  // Merge scales manually to ensure props take precedence but options can still configure other things
  const defaultScales = {
    x: {
      display: props.showXAxis,
      grid: { display: false },
      ticks: { color: '#666', font: { size: 10 } },
    },
    y: {
      display: props.showYAxis,
      grace: props.showValues ? '25%' : '5%',
      grid: {
        display: props.showYAxis,
        drawOnChartArea: props.showYAxis,
        drawTicks: props.showYAxis,
      },
      ticks: { display: props.showYAxis && props.showYAxisTicks },
      border: { display: props.showYAxis },
    },
  }

  // We need to be careful not to let props.options.scales completely overwrite defaultScales
  // But we also want to allow props.options to override specific scale settings if needed (though props should be primary)
  // For now, let's assume props control visibility and basic config, and we ignore scales from options if it conflicts?
  // Or better: spread options, then overwrite scales with our merged version.

  const finalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: props.showValues
        ? {
            top: 20,
            bottom: 20,
          }
        : {
            top: 0,
            bottom: 0,
          },
    },
    ...props.options,
    plugins: {
      legend: { display: props.showLegend },
      tooltip: { enabled: false },
      ...props.options?.plugins,
    },
    events: [],
    scales: {
      ...props.options?.scales,
      x: {
        ...defaultScales.x,
        ...props.options?.scales?.x,
        display: props.showXAxis, // Enforce prop
      },
      y: {
        ...defaultScales.y,
        ...props.options?.scales?.y,
        display: props.showYAxis, // Enforce prop
        grid: {
          ...defaultScales.y.grid,
          ...props.options?.scales?.y?.grid,
          display: props.showYAxis,
          drawTicks: props.showYAxis && props.showYAxisTicks,
        }, // Enforce prop
        ticks: {
          ...defaultScales.y.ticks,
          ...props.options?.scales?.y?.ticks,
          display: props.showYAxis && props.showYAxisTicks,
          callback:
            props.showYAxis && props.showYAxisTicks
              ? props.options?.scales?.y?.ticks?.callback
              : () => null,
        }, // Enforce prop
        border: {
          ...defaultScales.y.border,
          ...props.options?.scales?.y?.border,
          display: props.showYAxis,
        }, // Enforce prop
      },
    },
  }

  console.log('BarChart finalOptions:', {
    showYAxis: props.showYAxis,
    showYAxisTicks: props.showYAxisTicks,
    yScale: finalOptions.scales.y,
  })

  chartInstance = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.data.map((d) => d.label),
      datasets: [
        {
          data: props.data.map((d) => d.value),
          backgroundColor: props.color,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 'flex',
          maxBarThickness: 50,
        },
      ],
    },
    options: finalOptions,
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
