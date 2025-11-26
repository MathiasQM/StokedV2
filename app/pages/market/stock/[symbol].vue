<script setup lang="ts">
import { gradientLinePlugin } from '@/lib/chart/gradientLinePlugin'
import { pointerCrosshair } from '@/lib/chart/CrosshairPlugin'
import { gradientFlarePlugin } from '@/lib/chart/gradientFlarePlugin'
import { useFundamentalsStore } from '@@/stores/fundamentals'
import { useStockFinancials } from '~/composables/useStockFinancials'
import { useIntervalRefresh } from '~/composables/useIntervalRefresh'

definePageMeta({ validate: (route) => !!route.params.symbol })

const route = useRoute()
const router = useRouter()
const symbol = computed(() => route.params.symbol as string)

const hoveredChartData = ref<any>(null)

const activeTab = computed({
  get: () => (route.query.tab as string) || 'overview',
  set: (val) => router.replace({ query: { ...route.query, tab: val } }),
})

const store = useFundamentalsStore()

// Define refresh logic
const refreshData = () => {
  store.fetchStockSection(symbol.value, 'General')
  store.fetchStockSection(symbol.value, 'Highlights')
  store.fetchStockSection(symbol.value, 'Valuation')

  if (activeTab.value === 'financials') {
    store.fetchStockSection(symbol.value, 'Financials')
    store.fetchStockSection(symbol.value, 'SplitsDividends')
  }
}

// Use interval refresh
useIntervalRefresh(refreshData)

// Fetch General data on mount (eager)
onMounted(() => {
  refreshData()
})

// Watch active tab to lazy load data
watch(
  activeTab,
  (tab) => {
    // If the tab changes, immediately refresh data for the new tab
    // This will fetch 'Financials' and 'SplitsDividends' if tab is 'financials'
    // and also re-fetch other sections to ensure data is fresh.
    refreshData()
  },
  { immediate: true },
)

// Merge data sections for useStockFinancials
const stockData = computed(() => {
  const s = symbol.value
  const general = store.getSection(s, 'General')
  const highlights = store.getSection(s, 'Highlights')
  const valuation = store.getSection(s, 'Valuation')
  const financials = store.getSection(s, 'Financials')
  const dividends = store.getSection(s, 'SplitsDividends')

  // Merge available sections into a single object mimicking EodFundamentals
  return {
    General: general,
    Highlights: highlights,
    Valuation: valuation,
    Financials: financials,
    SplitsDividends: dividends,
    // Add other sections as needed
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
        <div class="text-white/60 py-8 text-center">
          <div class="mt-5">
            <StockKPIs :sections="sections" />
          </div>
        </div>
      </template>
      <template #analysis v-if="activeTab === 'analysis'">
        <div class="text-white/60 py-8 text-center">
          Analysis coming soon...
        </div>
      </template>
    </AppTabs>
  </AppContainer>
</template>
