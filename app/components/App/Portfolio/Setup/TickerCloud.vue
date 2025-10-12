<script setup lang="ts">
import { usePortfolio } from '@/composables/usePortfolio'
import { useMarketQuote } from '@/composables/market/useMarketQuote'

// Use the central state and actions from our composable
const { newPortfolioPositions, removePosition } = usePortfolio()
const { fetchLiveQuotes } = useMarketQuote()

// Store live data (like percentage change) for the tickers
const liveData = ref<Record<string, { change_p: number }>>({})

async function fetchChanges() {
  if (newPortfolioPositions.value.length === 0) {
    liveData.value = {}
    return
  }

  const symbols = newPortfolioPositions.value.map((p) => {
    const exchange = ['NASDAQ', 'NYSE', 'BATS', 'NYSE ARCA'].includes(
      p.Exchange,
    )
      ? 'US'
      : p.Exchange
    return `${p.Code}.${exchange}`
  })

  try {
    const quotes = await fetchLiveQuotes(symbols)
    console.log('Fetched quotes for ticker cloud:', quotes)
    const newLiveData: Record<string, { change_p: number }> = {}
    // The fetchLiveQuotes might return an array or object, handle both
    const quotesArray = Array.isArray(quotes) ? quotes : Object.values(quotes)

    for (const q of quotesArray) {
      if (q?.code) {
        // Extract the ticker 'AAPL' from 'AAPL.US'
        const ticker = q.code.split('.')[0]
        newLiveData[ticker] = { change_p: q.change_p }
      }
    }
    liveData.value = newLiveData
  } catch (error) {
    console.error('Failed to fetch live quotes for ticker cloud:', error)
  }
}

// Fetch data when the component mounts and whenever the list of positions changes
onMounted(fetchChanges)
watch(newPortfolioPositions, fetchChanges, { deep: true })
</script>

<template>
  <div class="flex flex-col">
    <div
      v-if="newPortfolioPositions.length > 0"
      class="flex-grow overflow-y-auto p-4"
    >
      <div class="flex flex-wrap justify-center gap-3">
        <div
          v-for="stock in newPortfolioPositions"
          :key="`${stock.Code}-${stock.Exchange}`"
          class="group relative flex cursor-pointer items-center justify-between gap-2 rounded-full bg-zinc-800 p-1.5 text-xs font-medium text-white shadow-md transition-transform hover:scale-105"
          @click="removePosition(stock.Code)"
        >
          <span class="font-bold">{{ stock.Code }}</span>
          <span
            v-if="liveData[stock.Code]"
            :class="[
              liveData[stock.Code].change_p >= 0
                ? 'text-green-400'
                : 'text-red-400',
            ]"
          >
            {{ liveData[stock.Code].change_p >= 0 ? '+' : ''
            }}{{ liveData[stock.Code].change_p.toFixed(2) }}%
          </span>
          <Icon
            name="i-lucide-x"
            class="h-4 w-4 text-white opacity-50 group-hover:opacity-100"
          />
        </div>
      </div>
    </div>
    <div v-else class="flex flex-grow items-center justify-center">
      <div class="text-center text-muted-foreground">
        <p>Your new portfolio is empty.</p>
        <p class="text-sm">Use the search bar below to add stocks.</p>
      </div>
    </div>
  </div>
</template>
