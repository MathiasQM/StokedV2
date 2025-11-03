<template>
  <AppContainer :title="`Dashboard`">
    <AppTabs disablePaddingx v-model="activeTab" :tabs="tabs">
      <template #overview>
        <AppPortfolioDashboardOverview />
      </template>
      <template #holdings>
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

const tabs = ['overview', 'news', 'analysis', 'calendar', 'holdings']
const activeTab = ref(route.query.tab || tabs[0])
</script>
