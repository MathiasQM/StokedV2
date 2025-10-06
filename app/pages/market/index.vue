<template>
  <div class="w-full min-w-0 flex-1 overflow-y-auto">
    <SuperAdminImpersonationBanner v-if="user?._impersonated" :user="user" />

    <AppContainer title="Market">
      <div class="containerp-6">
        <h1 class="mb-6 text-3xl font-bold">Market Snapshot</h1>

        <!-- simple responsive cards -->
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ElementsCard
            v-for="sym in symbols"
            :key="sym"
            @click="navigateTo(`/market/stock/${sym}`)"
            >{{ sym }}</ElementsCard
          >
        </div>
      </div>
    </AppContainer>
  </div>
</template>

<script setup lang="ts">
import { usePortfolioStore } from '~~/stores/portfolio'

const portfolioStore = usePortfolioStore()
const { positions } = storeToRefs(portfolioStore)
const { user } = useUserSession()

const symbols = computed(() => positions.value.map((p) => p.symbol).sort())

definePageMeta({
  middleware: ['auth'],
})
</script>
