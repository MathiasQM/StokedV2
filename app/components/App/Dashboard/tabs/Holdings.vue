<template>
  <div>
    <div v-if="pending" class="space-y-4 p-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-16 w-full bg-zinc-800/50 rounded-lg animate-pulse"
      ></div>
    </div>

    <div v-else-if="error" class="text-center p-8 text-red-400">
      <p>Could not load holdings.</p>
    </div>

    <div
      v-else-if="!holdings || holdings.length === 0"
      class="text-center p-8 text-zinc-500"
    >
      <p>You don't have any holdings in this portfolio yet.</p>
    </div>

    <div v-else class="divide-y divide-zinc-800">
      <div
        v-for="holding in holdings"
        :key="holding.id"
        class="flex items-center p-4"
      >
        <div class="flex-shrink-0 mr-4">
          <img
            :src="getLogoSrc(holding.website)"
            class="w-10 h-10 bg-zinc-700 rounded-full"
            :alt="`${holding.name} logo`"
          />
        </div>

        <div class="flex-grow grid grid-cols-3 gap-4 items-center">
          <div>
            <p class="font-semibold text-white">{{ holding.name }}</p>
            <p class="text-sm text-zinc-400">
              {{ formatCurrency(holding.value, 'DKK') }}
            </p>
          </div>

          <div class="text-center">
            <p
              class="font-medium"
              :class="holding.return >= 0 ? 'text-green-400' : 'text-red-400'"
            >
              {{ formatPercent(holding.return) }}
            </p>
            <p class="text-xs text-zinc-500">Return</p>
          </div>

          <div class="text-right">
            <p
              class="font-medium"
              :class="holding.today >= 0 ? 'text-green-400' : 'text-red-400'"
            >
              {{ formatPercent(holding.today) }}
            </p>
            <p class="text-xs text-zinc-400">
              {{ formatCurrency(holding.latest, 'USD') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This composable gives you access to the current portfolio in the URL
const { currentPortfolio } = usePortfolio()

// Fetch data from our new API endpoint using the current portfolio's ID
const {
  data: holdings,
  pending,
  error,
} = await useAsyncData(
  `holdings-${currentPortfolio.value.id}`,
  () => $fetch(`/api/portfolios/${currentPortfolio.value.id}/positions`),
  { watch: [currentPortfolio] }, // Re-fetch if the portfolio changes
)

// --- Helper Functions ---

/**
 * Creates a Clearbit logo URL, matching the provided example.
 * Includes a fallback for when the website URL is not available.
 * @param website - The full URL of the company's website.
 */
function getLogoSrc(website: string | null | undefined): string {
  const fallbackLogo = 'https://logo.clearbit.com/stoked.dev' // A generic fallback
  if (!website) {
    return fallbackLogo
  }
  return `https://logo.clearbit.com/${encodeURIComponent(website)}`
}

// Formats numbers as currency (e.g., 15,213 kr)
function formatCurrency(value: number, currency: 'DKK' | 'USD') {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

// Formats numbers as percentages (e.g., +26.69%)
function formatPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// Simple helper to guess a domain for the logo API
function getDomain(name: string) {
  return (
    name.replace(/ Inc\.| Corp\.| Class A| Class C/g, '').toLowerCase() + '.com'
  )
}
</script>
