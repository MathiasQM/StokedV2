<template>
  <div class="overflow-hiddden">
    <div
      class="fixed top-0 right-1/2 -z-10 flex justify-center h-[calc(100vh)]"
    >
      <div class="linear-gradient-layer absolute -z-1"></div>
      <div class="linear-gradient-layer-bottom absolute -z-1"></div>
      <div class="radial-gradient-layer absolute -z-1"></div>
    </div>
    <div class="flex-shrink-0">
      <div
        class="lg:hidden w-full h-42 flex flex-col justify-center items-center space-y-2"
      >
        <h2 class="first-letter:uppercase text-3xl font-semibold">
          {{ user?.name }}
        </h2>
        <h3 class="text-sm font-medium">{{ user?.email }}</h3>
        <h4 class="text-xs font-normal text-black-400">{{ user?.id }}</h4>
      </div>
    </div>
    <AppTabs v-model="activeTab" :tabs="tabs">
      <template #settings v-if="activeTab === 'settings'">
        <AppAccountSettings />
      </template>

      <template #portfolio v-if="activeTab === 'portfolio'">
        <div class="space-y-8">
          <AppPortfolioSettings v-if="portfolios.length > 0" />
          <AppPortfolioSettingsMembers v-if="portfolios.length > 0" />
          <AppPortfolioSettingsDelete v-if="portfolios.length > 0" />
          <div v-if="portfolios.length === 0" class="h-20 w-full p-5">
            <p class="text-sm text-neutral-500">
              You don't have any portfolios yet. Create one to get started!
            </p>
          </div>
        </div>
      </template>

      <template #billing v-if="activeTab === 'billing'">
        <AppAccountSettingsBilling />
      </template>

      <template #security v-if="activeTab === 'security'">
        <AppAccountSettingsSecurity />
      </template>

      <template #support v-if="activeTab === 'support'">
        <div class="bg-neutral-900 p-3 border border-neutral-800 rounded-lg">
          <AppAccountSettingsFeedbackForm />
        </div>
      </template>
    </AppTabs>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {
  AppAccountSettings,
  AppPortfolioSettings,
  AppPortfolioSettingsMembers,
} from '#components'

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const route = useRoute()
const { user } = useUserSession()
const { portfolios } = usePortfolio()
const tabs = ['settings', 'portfolio', 'billing', 'security', 'support']
const activeTab = ref(route.query.tab || tabs[0])
</script>
