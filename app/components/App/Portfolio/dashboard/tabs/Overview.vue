<template>
  <div class="flex flex-wrap gap-5">
    <ElementsCard
      enableBorderFlare
      class="group w-full flex-1 select-none min-w-[325px] h-[50vh]"
    >
      <ChartsWrapper :symbol="symbol">
        <template #default="{ quoteData }">
          <TickerMetric
            class="p-5"
            :quoteData="quoteData"
            :symbol="'New Portfolio'"
            :hover-data="hoveredChartData"
            :purpose="hoveredChartData ? 'chartTooltip' : 'ticker'"
          />
          <div v-if="quoteData && quoteData.length">
            <ChartsLineChart
              :key="symbol + '-news-chart'"
              :data="quoteData"
              :plugins="[
                gradientLinePlugin,
                pointerCrosshair,
                gradientFlarePlugin,
              ]"
              @hovered-data="(points) => (hoveredChartData = points[0])"
            />
          </div>

          <ChartsRangePicker :symbol="symbol" :data="quoteData" />
        </template>
      </ChartsWrapper>
    </ElementsCard>
    <div class="grid grid-cols-2 gap-3 place-content-start">
      <AppDemoKpi title="Followers" value="8551" up="19%" />
      <AppDemoKpi title="Impressions" value="80.5k" up="16%" />
      <AppDemoKpi title="Profile Visits" value="930" down="8%" />
      <AppDemoKpi title="Likes" value="12.5k" up="32%" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { pointerCrosshair } from '~/lib/chart/CrosshairPlugin'
import { gradientFlarePlugin } from '~/lib/chart/gradientFlarePlugin'
import { gradientLinePlugin } from '~/lib/chart/gradientLinePlugin'
import { usePortfolio } from '@/composables/usePortfolio'

definePageMeta({
  layout: 'default',
})
const symbol = 'AAPL'
const hoveredChartData = ref<any>(null)
const { currentPortfolio } = usePortfolio()
</script>
