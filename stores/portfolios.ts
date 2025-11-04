// /stores/portfolios.ts
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { usePortfolio } from '~/composables/usePortfolio'
import { useIntervalRefresh } from '~/composables/useIntervalRefresh'
import type { PortfolioPosition } from '~~/types/database'

export const usePortfoliosStore = defineStore('portfolios', () => {
  const positions = ref<PortfolioPosition[]>([])
  const pending = ref(false)
  const error = ref<Error | null>(null)

  const { currentPortfolio } = usePortfolio()

  async function fetchPositions() {
    const portfolioId = currentPortfolio.value?.id
    if (!portfolioId) return

    pending.value = true
    error.value = null
    try {
      const data = await $fetch<PortfolioPosition[]>(
        `/api/portfolios/${portfolioId}/positions`,
      )
      positions.value = data
    } catch (e) {
      error.value = e as Error
      positions.value = []
    } finally {
      pending.value = false
    }
  }

  // Watch to fetch when portfolio changes
  watch(
    currentPortfolio,
    async (newPortfolio) => {
      positions.value = [] // Clear old data
      if (newPortfolio) {
        await fetchPositions()
      }
    },
    { immediate: true },
  )

  // Automatic Refresh
  useIntervalRefresh(fetchPositions)

  return {
    // state
    positions,
    pending,
    error,
    // actions
    fetchPositions,
  }
})
