<script setup lang="ts">
import { gradientLinePlugin } from '@/lib/chart/gradientLinePlugin'
import { pointerCrosshair } from '@/lib/chart/CrosshairPlugin'
import { gradientFlarePlugin } from '@/lib/chart/gradientFlarePlugin'
import { useFundamentalsStore } from '~~/stores/stock/fundamentals'
import { useStockFinancials } from '~/composables/stock/useStockFinancials'
import { useIntervalRefresh } from '~/composables/useIntervalRefresh'

definePageMeta({ validate: (route) => !!route.params.symbol })

const route = useRoute()
const router = useRouter()
const symbol = computed(() => route.params.symbol as string)

const hoveredChartData = ref<any>(null)
const selectedRangeData = ref<any>(null)

const activeTab = computed({
  get: () => (route.query.tab as string) || 'overview',
  set: (val) => router.replace({ query: { ...route.query, tab: val } }),
})

const store = useFundamentalsStore()

const refreshData = () => {
  store.fetchStockSection(symbol.value, 'General')
  store.fetchStockSection(symbol.value, 'Highlights')
  store.fetchStockSection(symbol.value, 'Valuation')

  if (activeTab.value === 'financials') {
    store.fetchStockSection(symbol.value, 'Financials')
    store.fetchStockSection(symbol.value, 'SplitsDividends')
  }
}

useIntervalRefresh(refreshData)

onMounted(() => {
  refreshData()
})

watch(
  activeTab,
  (tab) => {
    refreshData()
  },
  { immediate: true },
)

const stockData = computed(() => {
  const general = store.getSection(symbol.value, 'General')
  const highlights = store.getSection(symbol.value, 'Highlights')
  const valuation = store.getSection(symbol.value, 'Valuation')
  const financials = store.getSection(symbol.value, 'Financials')
  const dividends = store.getSection(symbol.value, 'SplitsDividends')

  return {
    General: general,
    Highlights: highlights,
    Valuation: valuation,
    Financials: financials,
    SplitsDividends: dividends,
  } as any
})

const { sections } = useStockFinancials(stockData)

const tabs = ['overview', 'news', 'financials', 'analysis']
</script>

<template>
  <AppContainer disable-paddingx>
    <div class="flex w-full flex-wrap gap-5 lg:px-5">
      <CustomCard
        disableBorders
        class="group absolute top-0 left-0 w-full flex-1 select-none lg:min-w-0"
      >
        <ChartsWrapper :symbol="symbol" class="pt-20">
          <template #default="{ quoteData }">
            <TickerMetric
              class="px-5 mt-5 pt-0 md:pt-5 absolute -top-20"
              :quoteData="quoteData"
              :logoUrl="stockData?.General?.LogoURL"
              showIcon
              show
              :symbol="symbol"
              :hover-data="hoveredChartData"
              :range-data="selectedRangeData"
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
              @range-selected="(range) => (selectedRangeData = range)"
            />

            <!-- <ChartsRangePicker :symbol="symbol" :data="quoteData" /> -->
          </template>
        </ChartsWrapper>
      </CustomCard>
    </div>
    <!-- Tabs -->
    <AppTabs v-model="activeTab" :tabs="tabs">
      <template #overview v-if="activeTab === 'overview'"> </template>
      <template #news v-if="activeTab === 'news'">
        <AppPortfolioDashboardNews :symbol="symbol" />
      </template>
      <template #financials v-if="activeTab === 'financials'">
        <StockKPIs :sections="sections" />
      </template>
      <template #analysis v-if="activeTab === 'analysis'">
        <div class="text-white/60 py-8 text-center">
          Analysis coming soon...
        </div>
      </template>
    </AppTabs>
  </AppContainer>
</template>
