<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { TickerMeta, NewsItem } from '@@/types/eodhd'
import { Icon } from '#components'
import { useWatchlist } from '@/composables/useWatchlist'
import { usePortfolio } from '@/composables/usePortfolio'
import { useFundamentals } from '@/composables/market/useFundamentals'
import type { Position } from '~~/types/portfolios'

const props = defineProps<{
  context:
    | 'global'
    | 'news'
    | 'holdings'
    | 'settings'
    | 'wishlist'
    | 'stock-search'
    | 'create-portfolio'
  stockResults: TickerMeta[]
  newsResults: NewsItem[]
  settingsResults: any[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:context', context: any): void
  (e: 'select-stock', stock: TickerMeta): void
  (e: 'select-news', news: NewsItem): void
  (e: 'select-setting', setting: any): void
}>()

const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
const {
  newPortfolioPositions,
  removePosition,
  currentPortfolio,
  getPositions,
} = usePortfolio()

const contextOptions = [
  { value: 'global', label: 'Overview', icon: 'i-lucide-search' },
  { value: 'news', label: 'News', icon: 'i-lucide-newspaper' },
  { value: 'holdings', label: 'Holdings', icon: 'i-lucide-briefcase' },
  { value: 'settings', label: 'Settings', icon: 'i-lucide-settings' },
  { value: 'wishlist', label: 'Wishlist', icon: 'i-lucide-heart' },
]

const portfolioPositions = ref<Position[]>([])

// Fetch positions when entering holdings context
watch(
  () => props.context,
  async (newContext) => {
    if (newContext === 'holdings' && currentPortfolio.value?.id) {
      portfolioPositions.value = await getPositions()
    }
  },
  { immediate: true },
)

function isInPortfolio(stock: TickerMeta) {
  const inExisting = portfolioPositions.value.some((p) => {
    const [symbolCode] = p.symbol.split('.')
    return symbolCode === stock.Code
  })
  const inNew = newPortfolioPositions.value.some((p) => p.Code === stock.Code)
  return inExisting || inNew
}

function handleAddRemove(stock: TickerMeta) {
  if (isInPortfolio(stock)) {
    removePosition(stock.Code)
    portfolioPositions.value = portfolioPositions.value.filter(
      (p) => p.symbol.split('.')[0] !== stock.Code,
    )
  } else {
    newPortfolioPositions.value.push({ ...stock, shares: 0, cost: 0 } as any)
    portfolioPositions.value.push({
      symbol: `${stock.Code}.${stock.Exchange || 'US'}`,
      shares: 0,
      cost: 0,
    })
  }
}

// --- Logo Logic (using useFundamentals) ---
const resultSymbols = computed(() => {
  return props.stockResults.map((s) => `${s.Code}.${s.Exchange || 'US'}`)
})

const { fundamentalsMap } = useFundamentals({
  symbols: resultSymbols,
  filter: 'General', // Efficiently fetch only General info (includes LogoURL)
  maxAgeMs: 24 * 60 * 60 * 1000, // Cache for 24h
})

function getLogoUrl(stock: TickerMeta) {
  const symbol = `${stock.Code}.${stock.Exchange || 'US'}`
  return (
    fundamentalsMap.value[symbol]?.LogoURL ||
    `https://eodhistoricaldata.com/img/logos/${stock.Country || 'US'}/${stock.Code}.png`
  )
}

function onImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}
</script>

<template>
  <div class="w-full mx-auto flex flex-col-reverse gap-3 pb-2">
    <!-- Context Switcher -->
    <div class="w-full overflow-x-auto no-scrollbar pl-2">
      <div class="flex items-center gap-2 w-max pr-2">
        <button
          v-for="opt in contextOptions"
          :key="opt.value"
          @click="emit('update:context', opt.value)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap backdrop-blur-md shadow-sm border border-white/5"
          :class="
            context === opt.value
              ? 'bg-white text-black'
              : 'bg-black/40 text-white hover:bg-black/60'
          "
        >
          <Icon :name="opt.icon" class="w-3.5 h-3.5" />
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Results List -->
    <div
      class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto mx-2 no-scrollbar"
    >
      <div
        v-if="isLoading"
        class="p-3 text-center text-sm text-white/60 bg-black/40 backdrop-blur-md rounded-xl border border-white/10"
      >
        Searching...
      </div>

      <div
        v-else-if="
          !stockResults.length && !newsResults.length && !settingsResults.length
        "
        class="p-3 text-center text-sm text-white/60 bg-black/40 backdrop-blur-md rounded-xl border border-white/10"
      >
        No results found
      </div>

      <!-- Stocks -->
      <template
        v-if="
          stockResults.length > 0 &&
          [
            'global',
            'holdings',
            'wishlist',
            'stock-search',
            'create-portfolio',
          ].includes(context)
        "
      >
        <div
          v-for="stock in stockResults"
          :key="`${stock.Code}-${stock.Exchange}`"
          class="flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
          @click="emit('select-stock', stock)"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 p-1"
            >
              <img
                :src="getLogoUrl(stock)"
                @error="onImageError"
                class="w-full h-full object-contain rounded-full"
                alt=""
              />
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium text-white">{{
                stock.Code
              }}</span>
              <span class="text-xs text-white/60">{{ stock.Name }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2" @click.stop>
            <!-- Wishlist -->
            <button
              v-if="context === 'wishlist'"
              class="p-2 rounded-full hover:bg-white/10 transition-colors"
              @click="
                isInWatchlist(stock)
                  ? removeFromWatchlist(stock)
                  : addToWatchlist(stock)
              "
            >
              <Icon
                :name="
                  isInWatchlist(stock) ? 'i-lucide-heart' : 'i-lucide-heart'
                "
                class="w-4 h-4"
                :class="
                  isInWatchlist(stock)
                    ? 'text-red-500 fill-current'
                    : 'text-white/60'
                "
              />
            </button>

            <!-- Holdings Add/Remove -->
            <button
              v-if="context === 'holdings'"
              class="px-3 py-1 text-xs font-medium rounded-full transition-colors border"
              :class="
                isInPortfolio(stock)
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
              "
              @click="handleAddRemove(stock)"
            >
              {{ isInPortfolio(stock) ? 'Remove' : 'Add' }}
            </button>
          </div>
        </div>
      </template>

      <!-- News -->
      <template v-if="newsResults.length > 0 && context === 'news'">
        <div
          v-for="news in newsResults"
          :key="news.date"
          class="flex flex-col gap-1 px-3 py-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
          @click="emit('select-news', news)"
        >
          <span class="text-sm font-medium text-white line-clamp-2">{{
            news.title
          }}</span>
          <span class="text-xs text-white/50 line-clamp-2">{{
            news.content
          }}</span>
        </div>
      </template>

      <!-- Settings -->
      <template v-if="settingsResults.length > 0 && context === 'settings'">
        <div
          v-for="setting in settingsResults"
          :key="setting.name"
          class="flex items-center justify-between px-3 py-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
          @click="emit('select-setting', setting)"
        >
          <span class="text-sm text-white">{{ setting.name }}</span>
          <Icon name="i-lucide-chevron-right" class="w-4 h-4 text-white/40" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
