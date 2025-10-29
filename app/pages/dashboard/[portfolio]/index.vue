<template>
  <AppContainer :title="`Dashboard`">
    <AppPortfolioDashboardOverview />
    <AppTabs disablePaddingx v-model="activeTab" :tabs="tabs">
      <template #overview>
        <AppPortfolioDashboardTabsCalendarRow
          v-model="selectedDate"
          dateFormat="d"
          disable-future
        />
      </template>
      <template #holdings>
        <AppPortfolioDashboardTabsHoldings />
      </template>
    </AppTabs>
  </AppContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const { $dayjs } = useNuxtApp()

const selectedDate = ref($dayjs())

definePageMeta({
  layout: 'default',
})

const tabs = ['overview', 'news', 'analysis', 'calendar', 'holdings']
const activeTab = ref(tabs[0])
</script>
