<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { PlusCircle, X } from 'lucide-vue-next'

// --- UI COMPONENT IMPORTS ---
// Assuming these are Shadcn/ui components, but any component library will work.
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast/use-toast'

// --- INTERFACES & UTILITIES ---
export interface Stock {
  id: string
  ticker: string
  name: string
  change: number
  logoUrl: string // Added for the company logo
}

const { toast } = useToast()

/**
 * Generates a consistent, colored placeholder logo URL based on the ticker.
 * @param ticker The stock ticker.
 * @returns A URL for a placeholder image.
 */
function generateLogoUrl(ticker: string): string {
  const colors = [
    'f56565',
    'ed8936',
    'ecc94b',
    '48bb78',
    '4299e1',
    '667eea',
    '9f7aea',
  ]
  const hashCode = ticker
    .split('')
    .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const color = colors[Math.abs(hashCode) % colors.length]
  const firstLetter = ticker.charAt(0).toUpperCase()
  return `https://placehold.co/40x40/${color}/white?text=${firstLetter}`
}

// --- DATA & STATE MANAGEMENT ---
const newTicker = ref('')
const isAdding = ref(false)

// Initial portfolio data, now including generated logo URLs.
const data = ref<Stock[]>([
  {
    id: 'aapl',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    change: -0.89,
    logoUrl: generateLogoUrl('AAPL'),
  },
  {
    id: 'msft',
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    change: 1.52,
    logoUrl: generateLogoUrl('MSFT'),
  },
  {
    id: 'tsla',
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    change: 2.11,
    logoUrl: generateLogoUrl('TSLA'),
  },
])

// --- MOCK API & CORE LOGIC ---
/**
 * Simulates fetching stock data from an API.
 * @param ticker The stock ticker to look up.
 */
async function fetchStockData(ticker: string): Promise<Stock | null> {
  console.log(`Searching for ${ticker}...`)
  await new Promise((resolve) => setTimeout(resolve, 600)) // Simulate network delay

  const tickerUpper = ticker.toUpperCase()
  const mockDatabase: Record<
    string,
    Omit<Stock, 'id' | 'ticker' | 'logoUrl'>
  > = {
    GOOGL: { name: 'Alphabet Inc.', change: 0.25 },
    AMZN: { name: 'Amazon.com, Inc.', change: -1.2 },
    NVDA: { name: 'NVIDIA Corp.', change: 3.45 },
    META: { name: 'Meta Platforms, Inc.', change: 1.15 },
    JPM: { name: 'JPMorgan Chase & Co.', change: -0.45 },
  }

  if (mockDatabase[tickerUpper]) {
    return {
      id: ticker.toLowerCase(),
      ticker: tickerUpper,
      logoUrl: generateLogoUrl(tickerUpper),
      ...mockDatabase[tickerUpper],
    }
  }
  return null
}

async function addStock() {
  if (!newTicker.value.trim()) return

  isAdding.value = true
  const tickerToAdd = newTicker.value.trim()

  if (
    data.value.some(
      (stock) => stock.ticker.toLowerCase() === tickerToAdd.toLowerCase(),
    )
  ) {
    toast({
      title: 'Duplicate Stock',
      description: `${tickerToAdd.toUpperCase()} is already in your portfolio.`,
      variant: 'destructive',
    })
    isAdding.value = false
    return
  }

  const newStock = await fetchStockData(tickerToAdd)
  isAdding.value = false

  if (newStock) {
    data.value.unshift(newStock)
    newTicker.value = ''
    toast({
      title: 'Success!',
      description: `${newStock.name} has been added.`,
    })
  } else {
    toast({
      title: 'Stock Not Found',
      description: `Could not find data for "${tickerToAdd.toUpperCase()}".`,
      variant: 'destructive',
    })
  }
}

function removeStock(id: string) {
  const stockToRemove = data.value.find((stock) => stock.id === id)
  data.value = data.value.filter((stock) => stock.id !== id)
  if (stockToRemove) {
    toast({
      title: `${stockToRemove.ticker} Removed`,
      description: `${stockToRemove.name} has been removed from your portfolio.`,
    })
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div v-if="data.length > 0" class="flex-grow overflow-y-auto p-4">
      <div class="flex flex-wrap justify-center gap-3">
        <div
          v-for="stock in data"
          :key="stock.id"
          class="group relative flex cursor-pointer items-center justify-between gap-2 rounded-full bg-zinc-800 p-1.5 text-xs font-medium text-white shadow-md transition-transform hover:scale-105"
          @click="removeStock(stock.id)"
        >
          <img
            :src="stock.logoUrl"
            :alt="`${stock.name} logo`"
            class="h-5 w-5 rounded-full bg-white object-cover"
          />
          <span class="font-bold">{{ stock.ticker }}</span>
          <span
            :class="[stock.change >= 0 ? 'text-green-400' : 'text-red-400']"
          >
            {{ stock.change >= 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
          </span>
          <Icon name="i-lucide-x" class="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
    <div v-else class="flex flex-grow items-center justify-center">
      <div class="text-center">
        <h3 class="text-lg font-semibold text-white">
          Your Portfolio is Empty
        </h3>
        <p class="text-muted-foreground">
          Use the search bar below to add a stock.
        </p>
      </div>
    </div>

    <!-- Bottom Search & Add Bar -->
    <div class="flex-shrink-0 p-4">
      <div class="flex items-center gap-2">
        <UInput
          v-model="newTicker"
          class="flex-grow"
          size="xl"
          placeholder="Search for a stock ticker (e.g., GOOGL)..."
          @keyup.enter="addStock"
        />
        <Button @click="addStock" :disabled="isAdding" class="flex-shrink-0">
          <PlusCircle class="mr-2 h-4 w-4" />
          {{ isAdding ? 'Adding...' : 'Add' }}
        </Button>
      </div>
    </div>
  </div>
</template>
