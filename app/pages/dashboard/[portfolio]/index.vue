<template>
  <AppContainer :title="`Dashboard`">
    <AppTabs disablePaddingx v-model="activeTab" :tabs="tabs">
      <template #overview>
        <AppPortfolioDashboardOverview />
      </template>
      <template #holdings>
        <AppPortfolioDashboardTabsHoldings />
      </template>
    </AppTabs>
  </AppContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

definePageMeta({
  layout: 'default',
})

const tabs = ['overview', 'news', 'analysis', 'calendar', 'holdings']
const activeTab = ref(tabs[0])
</script>
