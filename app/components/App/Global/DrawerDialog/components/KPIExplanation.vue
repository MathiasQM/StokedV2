<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import BarChart from '~/components/charts/BarChart.vue'

const props = defineProps<{
  title: string
  description: string
  formula?: string
  interpretation?: string
  analysis?: string
  history?: { date: string; value: number }[]
  isPercent?: boolean
  currency?: string
}>()

const chartData = computed(() => {
  if (!props.history || props.history.length === 0) return []

  const sorted = [...props.history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const filtered = sorted

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

const scrollContainer = ref<HTMLElement | null>(null)

const scrollToRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = scrollContainer.value.scrollWidth
  }
}

onMounted(() => {
  // Small delay to ensure rendering is complete
  setTimeout(scrollToRight, 100)
})

watch(
  () => chartData.value,
  () => {
    nextTick(() => {
      scrollToRight()
    })
  },
)
</script>

<template>
  <div class="p-4 space-y-6">
    <div
      v-if="chartData.length"
      class="space-y-4 border-b border-white/10 pb-6"
    >
      <div ref="scrollContainer" class="h-48 w-full overflow-x-auto">
        <div
          :style="{ width: `${Math.max(100, (chartData.length / 6) * 100)}%` }"
          class="h-full"
        >
          <BarChart
            :data="chartData"
            color="#f97316"
            showValues
            :isPercent="isPercent"
            :currency="currency"
            showXAxis
            showYAxis
            :showYAxisTicks="false"
          />
        </div>
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
        <Icon name="lucide-lightbulb" class="w-4 h-4" />
        Analysis
      </h3>
      <p class="text-blue-100/80 text-sm leading-relaxed">
        {{ analysis }}
      </p>
    </div>

    <div
      v-if="formula && formula !== 'N/A'"
      class="bg-white/5 border border-white/10 p-4 rounded-lg space-y-2"
    >
      <h3 class="text-sm font-semibold text-white/80 flex items-center gap-2">
        <Icon name="lucide-calculator" class="w-4 h-4" />
        Formula
      </h3>
      <code
        class="text-xs bg-black/30 px-2 py-1 rounded text-orange-400 block w-fit"
      >
        {{ formula }}
      </code>
    </div>

    <div v-if="interpretation" class="space-y-2">
      <h3 class="text-lg font-semibold text-foreground">How to read it?</h3>
      <p class="text-muted-foreground text-sm leading-relaxed">
        {{ interpretation }}
      </p>
    </div>
  </div>
</template>
