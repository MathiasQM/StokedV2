<template>
  <AppContainer :title="`Dashboard`">
    <AppTabs disablePaddingx v-model="activeTab" :tabs="tabs">
      <template #overview v-if="activeTab === 'overview'">
        <AppPortfolioDashboardOverview />
      </template>
      <template #news v-if="activeTab === 'news'">
        <AppPortfolioDashboardNews />
      </template>
      <template #holdings v-if="activeTab === 'holdings'">
        <AppPortfolioTable />
      </template>
    </AppTabs>
  </AppContainer>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})

const route = useRoute()

const tabs = ['overview', 'news', 'holdings'] //'analysis', 'calendar',
const activeTab = ref(route.query.tab || tabs[0])
</script>
