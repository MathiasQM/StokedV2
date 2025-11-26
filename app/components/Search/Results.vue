<script setup lang="ts">
import { computed } from 'vue'
import type { TickerMeta, NewsItem } from '@@/types/eodhd'
import { useFundamentals } from '@/composables/market/useFundamentals'
import { useWatchlist } from '@/composables/useWatchlist'
import { usePortfolio } from '@/composables/usePortfolio'

const props = defineProps<{
  context: string
  results: {
    stocks?: TickerMeta[]
    etfs?: TickerMeta[]
    funds?: TickerMeta[]
    others?: TickerMeta[]
  }
  newsResults: NewsItem[]
  settingsResults: any[]
}>()

const emit = defineEmits<{
  (e: 'resultClick', item: TickerMeta): void
  (e: 'newsClick', item: NewsItem): void
  (e: 'settingClick', item: any): void
}>()

// --- Composables ---
const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
const {
  newPortfolioPositions,
  removePosition,
  currentPortfolio,
  getPositions,
} = usePortfolio()

// --- Portfolio Logic (Local) ---
// We need to know if a stock is in the portfolio.
// This requires access to portfolioPositions.
// Since usePortfolio is global/shared state, we can use it here.
// However, Overlay.vue was fetching positions on context change.
// We might need to duplicate that or pass positions as props.
// For now, let's rely on the composable's state if possible, or pass it down.
// Overlay.vue fetches it: `portfolioPositions.value = await getPositions()`
// We should probably pass `portfolioPositions` as a prop to be safe and reactive.
// But `usePortfolio` exposes `portfolioPositions`? No, it exposes `getPositions`.
// Let's assume we need to pass the list of current holdings to check against.
// Actually, `usePortfolio` might not expose a reactive `positions` list directly that updates automatically?
// In Overlay.vue: `const portfolioPositions = ref<Position[]>([])`
// So we should pass `portfolioPositions` as a prop.

// Wait, I can't change the props easily without updating the plan/file write.
// I'll add `portfolioPositions` to props.

// --- Logos ---
const resultSymbols = computed(() => {
  const allStocks = [
    ...(props.results.stocks || []),
    ...(props.results.etfs || []),
    ...(props.results.funds || []),
    ...(props.results.others || []),
  ]
  return [...new Set(allStocks.map((s) => `${s.Code}.${s.Exchange || 'US'}`))]
})

const { fundamentalsMap } = useFundamentals({
  symbols: resultSymbols,
  filter: 'General',
  maxAgeMs: 24 * 60 * 60 * 1000,
})

function getLogoUrl(stock: TickerMeta) {
  const symbol = `${stock.Code}.${stock.Exchange || 'US'}`
  return (
    fundamentalsMap.value[symbol]?.LogoURL ||
    `https://eodhistoricaldata.com/img/logos/${stock.Country || 'US'}/${stock.Code}.png`
  )
}

function onImageError(e: Event) {
  ;(e.target as HTMLImageElement).style.display = 'none'
}

// --- Portfolio Actions ---
// We need `portfolioPositions` prop to check `isInPortfolio`.
// I will add it to the props definition below.
</script>

<script lang="ts">
// Separate script block for interface extension if needed, or just modify setup.
</script>

<template>
  <div class="flex flex-col gap-6 pb-20 md:pb-0">
    <!-- News Results -->
    <div v-if="context === 'news' && newsResults.length">
      <div class="flex flex-col gap-2">
        <div
          v-for="news in newsResults"
          :key="news.date"
          class="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-white/5"
          @click="$emit('newsClick', news)"
        >
          <span class="text-sm font-medium text-white line-clamp-2">{{
            news.title
          }}</span>
          <span class="text-xs text-white/50 line-clamp-2">{{
            news.content
          }}</span>
        </div>
      </div>
    </div>

    <!-- Settings Results -->
    <div v-if="context === 'settings' && settingsResults.length">
      <div class="flex flex-col gap-2">
        <div
          v-for="setting in settingsResults"
          :key="setting.name"
          class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-white/5"
          @click="$emit('settingClick', setting)"
        >
          <span class="text-sm text-white">{{ setting.name }}</span>
          <Icon name="i-lucide-chevron-right" class="w-4 h-4 text-white/40" />
        </div>
      </div>
    </div>

    <!-- Stock Results (Categorized) -->
    <template
      v-if="
        [
          'global',
          'holdings',
          'wishlist',
          'stock-search',
          'create-portfolio',
        ].includes(context)
      "
    >
      <!-- Stocks -->
      <div v-if="results.stocks?.length">
        <h3 class="text-xs font-semibold text-white/40 uppercase mb-3 px-2">
          Stocks
        </h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="stock in results.stocks"
            :key="stock.Code"
            class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer group"
            @click="$emit('resultClick', stock)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-white/10 p-1 overflow-hidden flex items-center justify-center"
              >
                <img
                  :src="getLogoUrl(stock)"
                  @error="onImageError"
                  class="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <div class="text-white font-medium">
                  {{ stock.Code }}
                </div>
                <div class="text-white/60 text-xs">
                  {{ stock.Name }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2" @click.stop>
              <button
                v-if="context === 'wishlist'"
                class="p-2 rounded-full hover:bg-white/10"
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
                  class="w-5 h-5"
                  :class="
                    isInWatchlist(stock)
                      ? 'text-red-500 fill-current'
                      : 'text-white/40'
                  "
                />
              </button>
              <!-- Holdings Action needs portfolioPositions prop or event -->
              <slot name="action" :stock="stock" />
            </div>
          </div>
        </div>
      </div>

      <!-- ETFs -->
      <div v-if="results.etfs?.length">
        <h3 class="text-xs font-semibold text-white/40 uppercase mb-3 px-2">
          ETFs
        </h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="stock in results.etfs"
            :key="stock.Code"
            class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer"
            @click="$emit('resultClick', stock)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-white/10 p-1 overflow-hidden flex items-center justify-center"
              >
                <img
                  :src="getLogoUrl(stock)"
                  @error="onImageError"
                  class="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <div class="text-white font-medium">
                  {{ stock.Code }}
                </div>
                <div class="text-white/60 text-xs">
                  {{ stock.Name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Funds -->
      <div v-if="results.funds?.length">
        <h3 class="text-xs font-semibold text-white/40 uppercase mb-3 px-2">
          Funds
        </h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="stock in results.funds"
            :key="stock.Code"
            class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer"
            @click="$emit('resultClick', stock)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-white/10 p-1 overflow-hidden flex items-center justify-center"
              >
                <img
                  :src="getLogoUrl(stock)"
                  @error="onImageError"
                  class="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <div class="text-white font-medium">
                  {{ stock.Code }}
                </div>
                <div class="text-white/60 text-xs">
                  {{ stock.Name }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
