<template>
  <AppContainer :title="`${currentPortfolio?.name} Home (Demo Page)`">
    <div class="space-y-6">
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AppDemoKpi title="Followers" value="8551" up="19%" />
        <AppDemoKpi title="Impressions" value="80.5k" up="16%" />
        <AppDemoKpi title="Profile Visits" value="930" down="8%" />
        <AppDemoKpi title="Likes" value="12.5k" up="32%" />
      </div>
      <AppDemoChart title="Impressions Overview" />
      <AppDemoTable />
    </div>
  </AppContainer>
</template>
<script lang="ts" setup>
// import { pointerCrosshair } from '~/lib/chart/CrosshairPlugin'
// import { gradientFlarePlugin } from '~/lib/chart/gradientFlarePlugin'
// import { gradientLinePlugin } from '~/lib/chart/gradientLinePlugin'
import { usePortfolio } from '@/composables/usePortfolio'

definePageMeta({
  layout: 'default',
})
// const symbol = 'AAPL'
// const hoveredChartData = ref<any>(null)
const { currentPortfolio } = usePortfolio()
</script>
