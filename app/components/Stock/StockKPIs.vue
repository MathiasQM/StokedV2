<script setup lang="ts">
import { KPI_DEFINITIONS } from '~/utils/kpi-definitions'
import { useGlobalDrawerDialogStore } from '@@/stores/globalDrawerDialog'
import type { KPISection } from '~/composables/stock/useStockFinancials'
import BarChart from '~/components/charts/BarChart.vue'

defineProps<{
  sections: KPISection[]
}>()

const isMobile = useIsMobile()
const store = useGlobalDrawerDialogStore()

const openExplanation = (
  label: string,
  value: number | string,
  history?: { date: string; value: number }[],
  isPercent?: boolean,
) => {
  const def = KPI_DEFINITIONS[label]
  if (!def) return

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  const analysis =
    def.analyze && !isNaN(numValue) ? def.analyze(numValue) : undefined

  store.openModal({
    title: label,
    mode: isMobile.value ? 'drawer' : 'sheet',
    componentName: 'KPIExplanation',
    componentProps: {
      title: label,
      description: def.description,
      formula: def.formula,
      interpretation: def.interpretation,
      analysis,
      history,
      isPercent,
    },
  })
}

const formatHistory = (history?: { date: string; value: number }[]) => {
  if (!history) return []
  // Filter for one bar per year (e.g. the last available data point for each year)
  const yearlyMap = new Map<number, { date: string; value: number }>()

  history.forEach((h) => {
    const year = new Date(h.date).getFullYear()
    // Always overwrite to get the latest entry for the year
    yearlyMap.set(year, h)
  })

  return Array.from(yearlyMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((h) => ({ label: h.date, value: h.value }))
}
</script>

<template>
  <div class="space-y-8">
    <div v-for="section in sections" :key="section.title">
      <h3 class="text-sm text-start text-white/60 mb-3 ml-1">
        {{ section.title }}
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="item in section.items"
          :key="item.label"
          class="bg-[#151515] hover:bg-[#1A1A1A] rounded-xl p-2 cursor-pointer transition-colors flex flex-col justify-between relative overflow-hidden group"
          @click="
            openExplanation(
              item.definitionKey,
              item.value,
              item.history,
              item.isPercent,
            )
          "
        >
          <span class="text-xs text-white/40 font-medium text-start">{{
            item.label
          }}</span>
          <div class="flex justify-between items-center z-10">
            <div class="flex flex-col gap-1 text-start">
              <span class="text-md font-bold text-white tracking-tight">{{
                item.formattedValue
              }}</span>
            </div>
            <!-- Bar Chart Icon -->
            <div class="h-8 w-12 transition-opacity flex items-end">
              <BarChart
                :showLegend="false"
                :showYAxis="false"
                v-if="item.history && item.history.length"
                :data="formatHistory(item.history)"
                color="#f97316"
              />
              <!-- Fallback CSS chart if no history -->
              <div
                v-else
                class="flex items-end gap-[2px] h-5 w-full justify-end"
              >
                <div class="w-1 bg-white/10 rounded-t-sm h-[40%]"></div>
                <div class="w-1 bg-white/10 rounded-t-sm h-[70%]"></div>
                <div class="w-1 bg-white/10 rounded-t-sm h-[50%]"></div>
                <div class="w-1 bg-white/10 rounded-t-sm h-[100%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
