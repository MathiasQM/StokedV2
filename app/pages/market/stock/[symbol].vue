<script setup lang="ts">
import { gradientLinePlugin } from '@/lib/chart/gradientLinePlugin'
import { pointerCrosshair } from '@/lib/chart/CrosshairPlugin'
import { gradientFlarePlugin } from '@/lib/chart/gradientFlarePlugin'

definePageMeta({ validate: (route) => !!route.params.symbol })

const isMobile = useIsMobile()
const route = useRoute()
const symbol = route.params.symbol as string

const hoveredChartData = ref<any>(null)
</script>

<template>
  <AppContainer :disable-paddingx="isMobile">
    <div class="flex w-full flex-wrap gap-5">
      <ElementsCard
        disableBorders
        class="group absolute top-0 left-0 w-full flex-1 select-none lg:min-w-0"
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

            <ChartsLineChart
              v-if="quoteData && quoteData.length"
              :key="symbol"
              :data="quoteData"
              :plugins="[
                gradientLinePlugin,
                pointerCrosshair,
                gradientFlarePlugin,
              ]"
              @hovered-data="(points) => (hoveredChartData = points[0])"
            />

            <ChartsRangePicker :symbol="symbol" :data="quoteData" />
          </template>
        </ChartsWrapper>
      </ElementsCard>
    </div>
  </AppContainer>
</template>
