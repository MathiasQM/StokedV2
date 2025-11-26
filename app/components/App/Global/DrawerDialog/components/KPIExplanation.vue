<script setup lang="ts">
import { computed } from 'vue'
import BarChart from '~/components/charts/BarChart.vue'

const props = defineProps<{
  title: string
  description: string
  formula?: string
  interpretation?: string
  analysis?: string
  history?: { date: string; value: number }[]
  isPercent?: boolean
}>()

const chartData = computed(() => {
  if (!props.history || props.history.length === 0) return []

  const sorted = [...props.history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const filtered = sorted.filter((d) => {
    const date = new Date(d.date)
    const month = date.getMonth()
    const threeYearsAgo = new Date()
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
    return date >= threeYearsAgo && (month === 5 || month === 11)
  })

  return filtered.map((d) => {
    const date = new Date(d.date)
    const year = date.getFullYear()
    const month = date.getMonth()
    const quarter = Math.ceil((month + 1) / 3)

    return {
      label: `${year} Q${quarter}`,
      value: d.value,
      date: d.date,
    }
  })
})

const chartOptions = {
  plugins: {
    tooltip: {
      enabled: true,
      callbacks: {
        label: (context: any) => context.raw.toLocaleString(),
      },
    },
  },
  scales: {
    x: {
      display: true,
      grid: { display: false },
      ticks: { color: '#666', font: { size: 10 } },
    },
    y: { display: false },
  },
}
</script>

<template>
  <div class="p-4 space-y-6">
    <div v-if="chartData.length" class="space-y-4">
      <div class="h-48 w-full">
        <BarChart
          :data="chartData"
          color="#f97316"
          :options="chartOptions"
          showValues
          :isPercent="isPercent"
        />
      </div>
      <p class="text-xs text-muted-foreground text-center">
        Historical Data (Quarterly)
      </p>
    </div>

    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-foreground">What is it?</h3>
      <p class="text-muted-foreground text-sm leading-relaxed">
        {{ description }}
      </p>
    </div>

    <div
      v-if="analysis"
      class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg space-y-2"
    >
      <h3 class="text-sm font-semibold text-blue-400 flex items-center gap-2">
        <span class="i-lucide-lightbulb w-4 h-4" />
        Analysis
      </h3>
      <p class="text-blue-100/80 text-sm leading-relaxed">
        {{ analysis }}
      </p>
    </div>

    <div v-if="formula" class="space-y-2">
      <h3 class="text-lg font-semibold text-foreground">Formula</h3>
      <div class="bg-muted/50 p-3 rounded-md font-mono text-sm text-center">
        {{ formula }}
      </div>
    </div>

    <div v-if="interpretation" class="space-y-2">
      <h3 class="text-lg font-semibold text-foreground">How to read it?</h3>
      <p class="text-muted-foreground text-sm leading-relaxed">
        {{ interpretation }}
      </p>
    </div>
  </div>
</template>
