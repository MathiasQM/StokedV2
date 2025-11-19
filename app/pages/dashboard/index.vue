<template>
  <div class="h-full min-h-[60vh] flex items-center justify-center">
    <div
      v-if="!loading && portfolios.length === 0"
      class="flex flex-col items-center justify-center gap-6 text-center px-4"
    >
      <div class="p-4 rounded-full bg-neutral-100 dark:bg-white/5">
        <UIcon name="i-lucide-briefcase" class="w-12 h-12 text-neutral-400" />
      </div>
      <div class="space-y-2">
        <h2 class="text-xl font-semibold">No portfolios found</h2>
        <p class="text-neutral-500 dark:text-neutral-400 max-w-sm">
          Create your first portfolio to start tracking your investments and get
          personalized insights.
        </p>
      </div>
      <UButton
        label="Create Portfolio"
        icon="i-lucide-plus"
        size="xl"
        color="neutral"
        @click="portfolioStore.openPortfolioSetupModal()"
      />
    </div>
    <div v-else class="flex flex-col items-center gap-4">
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-neutral-400"
      />
      <p class="text-sm text-neutral-500">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePortfolioSetupModal } from '~~/stores/portfolioSetupModal'

const portfolioStore = usePortfolioSetupModal()
const { loading, portfolios } = usePortfolio()

definePageMeta({
  middleware: ['auth'],
})
</script>
