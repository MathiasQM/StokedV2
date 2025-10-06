<template>
  <AppContainer title="News">
    <ElementsCard
      enableBorderFlare
      enableDots
      class="group w-full flex-1 select-none lg:min-w-0"
    >
      <ChartsWrapper :symbol="symbol">
        <template #default="{ quoteData }">
          <TickerMetric
            class="p-5"
            :quoteData="quoteData"
            :symbol="symbol"
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
  </AppContainer>
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
