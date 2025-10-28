<script setup lang="ts">
import { gradientLinePlugin } from '@/lib/chart/gradientLinePlugin'
import { pointerCrosshair } from '@/lib/chart/CrosshairPlugin'
import { gradientFlarePlugin } from '@/lib/chart/gradientFlarePlugin'

definePageMeta({ validate: (route) => !!route.params.symbol })

const route = useRoute()
const symbol = route.params.symbol as string

const hoveredChartData = ref<any>(null)

const tabs = [
  'overview',
  'news',
  'analysis',
  'financials',
  'options',
  'order book',
] as const
const activeTab = ref(tabs[0])
</script>

<template>
  <AppContainer disable-paddingx>
    <div class="flex w-full flex-wrap gap-5 lg:px-5">
      <ElementsCard
        disableBorders
        class="group absolute top-0 left-0 w-full flex-1 select-none lg:min-w-0"
      >
        <ChartsWrapper :symbol="symbol" class="pt-20">
          <template #default="{ quoteData }">
            <TickerMetric
              class="px-5 pt-0 md:pt-5 absolute -top-20"
              :quoteData="quoteData"
              showIcon
              show
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
    <AppTabs v-model="activeTab" :tabs="tabs">
      <template #news>
        <TickerNews :symbol="symbol" />
      </template>
    </AppTabs>
  </AppContainer>
</template>
