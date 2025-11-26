```
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useSearch } from '@/composables/useSearch'
import { useNewsFeed } from '@/composables/market/useNews'
import { useDebounceFn, onKeyStroke, useLocalStorage } from '@vueuse/core'
import type { TickerMeta, NewsItem } from '@@/types/eodhd'
import { useWatchlist } from '@/composables/useWatchlist'
import { usePortfolio } from '@/composables/usePortfolio'
import type { Position } from '~~/types/portfolios'

// Components
import SearchFilters from './Filters.vue'
import SearchContextSwitcher from './ContextSwitcher.vue'
import SearchHistory from './History.vue'
import SearchResults from './Results.vue'

// --- State & Composables ---
const { isOpen, closeSearch, context, setContext } = useCommandPalette()
const { search } = useSearch()
const { fetchNews } = useNewsFeed()
const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
const {
  newPortfolioPositions,
  removePosition,
  currentPortfolio,
  getPositions,
} = usePortfolio()

const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const isLoading = ref(false)
const rawResults = ref<TickerMeta[]>([])
const newsResults = ref<NewsItem[]>([])
const settingsResults = ref<any[]>([])
const activeFilter = ref<string>('All')

// --- Search History ---
const searchHistory = useLocalStorage<TickerMeta[]>('search-history', [])

function addToHistory(stock: TickerMeta) {
  const existingIndex = searchHistory.value.findIndex(
    (item) => item.Code === stock.Code && item.Exchange === stock.Exchange,
  )
  if (existingIndex !== -1) {
    searchHistory.value.splice(existingIndex, 1)
  }
  searchHistory.value.unshift(stock)
  if (searchHistory.value.length > 10) {
    searchHistory.value.pop()
  }
}

function clearHistory() {
  searchHistory.value = []
}

function removeFromHistory(stock: TickerMeta) {
  searchHistory.value = searchHistory.value.filter(
    (item) => !(item.Code === stock.Code && item.Exchange === stock.Exchange),
  )
}

function handleHistoryClick(item: TickerMeta) {
  query.value = item.Code
}

// --- Portfolio Logic ---
const portfolioPositions = ref<Position[]>([])
watch(
  () => context.value,
  async (newContext) => {
    if (newContext === 'holdings' && currentPortfolio.value?.id) {
      portfolioPositions.value = await getPositions()
    }
    activeFilter.value = 'All'
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

// --- Search Logic ---
const performSearch = useDebounceFn(async (q: string) => {
  if (q.trim().length < 2) {
    rawResults.value = []
    newsResults.value = []
    settingsResults.value = []
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    if (
      [
        'global',
        'holdings',
        'wishlist',
        'stock-search',
        'create-portfolio',
      ].includes(context.value)
    ) {
      const results = await search(q)
      rawResults.value = results.slice(0, 20)
    }

    if (context.value === 'news') {
      const stocks = await search(q)
      if (stocks.length > 0 && stocks[0]?.Code) {
        newsResults.value = await fetchNews(stocks[0].Code)
      } else {
        newsResults.value = []
      }
    }

    if (context.value === 'settings') {
      const allSettings = [
        { name: 'Profile', link: '/account?tab=settings' },
        { name: 'Security', link: '/account?tab=security' },
        { name: 'Billing', link: '/account?tab=billing' },
        { name: 'Notifications', link: '/account?tab=notifications' },
        { name: 'Appearance', link: '/account?tab=appearance' },
      ]
      settingsResults.value = allSettings.filter((s) =>
        s.name.toLowerCase().includes(q.toLowerCase()),
      )
    }
  } finally {
    isLoading.value = false
  }
}, 300)

watch(query, (newVal) => performSearch(newVal))
watch(context, () => {
  if (query.value) performSearch(query.value)
})

// --- Filtering & Categorization ---
const categorizedResults = computed(() => {
  const stocks = rawResults.value.filter((r) => r.Type === 'Common Stock')
  const etfs = rawResults.value.filter((r) => r.Type === 'ETF')
  const funds = rawResults.value.filter(
    (r) => r.Type === 'Fund' || r.Type === 'Mutual Fund',
  )
  const others = rawResults.value.filter(
    (r) => !['Common Stock', 'ETF', 'Fund', 'Mutual Fund'].includes(r.Type),
  )
  return { stocks, etfs, funds, others }
})

const displayResults = computed(() => {
  if (activeFilter.value === 'Stocks')
    return { stocks: categorizedResults.value.stocks }
  if (activeFilter.value === 'ETFs')
    return { etfs: categorizedResults.value.etfs }
  if (activeFilter.value === 'Funds')
    return { funds: categorizedResults.value.funds }
  return categorizedResults.value
})

const hasResults = computed(() => {
  if (context.value === 'news') return newsResults.value.length > 0
  if (context.value === 'settings') return settingsResults.value.length > 0
  return rawResults.value.length > 0
})

// Filters based on context
const currentFilters = computed(() => {
  if (context.value === 'news') return ['All', 'Latest', 'Trending']
  if (context.value === 'settings') return ['All', 'Account', 'App']
  return ['All', 'Stocks', 'ETFs', 'Funds']
})

// --- UI Actions ---
function close() {
  closeSearch()
  query.value = ''
}

function handleBack() {
  close()
}

function handleResultClick(stock: TickerMeta) {
  addToHistory(stock)
  if (context.value === 'global') {
    navigateTo(`/market/stock/${stock.Code}`)
    closeSearch()
  }
}

function handleNewsClick(news: NewsItem) {
  navigateTo(news.link, { external: true })
}

function handleSettingClick(setting: any) {
  navigateTo(setting.link)
  closeSearch()
}

// Focus input on open
watch(isOpen, (val) => {
  if (val) {
    nextTick(() => inputRef.value?.focus())
  }
})

// Keyboard Shortcuts
onKeyStroke(['k', 'K'], (e) => {
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
    e.preventDefault()
    if (isOpen.value) {
      closeSearch()
    } else {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        setContext('global')
      }
    }
  }
})

onKeyStroke('Escape', (e) => {
  if (isOpen.value) {
    e.preventDefault()
    close()
  }
})

// Context Options
const contextOptions = [
  { value: 'global', label: 'Overview', icon: 'i-lucide-search' },
  { value: 'news', label: 'News', icon: 'i-lucide-newspaper' },
  { value: 'wishlist', label: 'Wishlist', icon: 'i-lucide-heart' },
  { value: 'holdings', label: 'Holdings', icon: 'i-lucide-briefcase' },
  { value: 'settings', label: 'Settings', icon: 'i-lucide-settings' },
]
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/95 md:bg-black/50 md:backdrop-blur-sm"
        @click="close"
      >
        <!-- Mobile Header (Back + Input) -->
        <div
          class="flex items-center gap-3 px-4 pb-4 pt-safe md:hidden w-full border-b border-white/10 bg-black"
          @click.stop
        >
          <button @click="handleBack" class="text-white/60 hover:text-white">
            <Icon name="i-lucide-chevron-left" class="w-6 h-6" />
          </button>
          <div class="relative flex-1">
            <Icon
              name="i-lucide-search"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
            />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              :placeholder="`Search ${context}...`"
              class="w-full bg-white/10 rounded-full pl-9 pr-4 py-2 text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              v-if="query"
              @click="query = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
            >
              <Icon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Main Container (Responsive) -->
        <div
          class="flex flex-col w-full md:max-w-2xl md:bg-[#111] md:border md:border-white/10 md:rounded-xl md:shadow-2xl overflow-hidden h-full md:h-auto md:max-h-[600px]"
          @click.stop
        >
          <!-- Desktop Input (Hidden on Mobile) -->
          <div
            class="hidden md:flex items-center gap-3 p-4 border-b border-white/10"
          >
            <Icon name="i-lucide-search" class="w-5 h-5 text-white/40" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Search..."
              class="flex-1 bg-transparent text-lg text-white placeholder-white/40 outline-none"
            />
            <button @click="close" class="text-white/40 hover:text-white">
              <kbd class="px-2 py-1 text-xs font-mono bg-white/10 rounded"
                >ESC</kbd
              >
            </button>
          </div>

          <!-- Desktop Context Switcher & Filters -->
          <div
            class="hidden md:flex flex-col border-b border-white/10 bg-white/5"
          >
            <SearchContextSwitcher
              :context="context"
              :options="contextOptions"
              mode="desktop"
              @update:context="setContext"
            />
            <SearchFilters
              :filters="currentFilters"
              v-model:activeFilter="activeFilter"
              mode="desktop"
            />
          </div>

          <!-- Mobile Filters -->
          <div class="md:hidden">
            <SearchFilters
              :filters="currentFilters"
              v-model:activeFilter="activeFilter"
              mode="mobile"
            />
          </div>

          <!-- Results Area -->
          <div
            class="flex-1 overflow-y-auto p-4 md:bg-[#111] w-full md:max-w-2xl custom-scrollbar"
          >
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-8 text-white/40">
              Searching...
            </div>

            <!-- Empty State / History -->
            <div v-else-if="!query && !hasResults" class="flex flex-col gap-4">
              <SearchHistory
                v-if="searchHistory.length > 0"
                :history="searchHistory"
                @click="handleHistoryClick"
                @remove="removeFromHistory"
                @clear="clearHistory"
              />
              <div v-else class="text-center py-8 text-white/40">
                Type to search...
              </div>
            </div>

            <!-- No Results -->
            <div
              v-else-if="!hasResults && query"
              class="text-center py-8 text-white/40"
            >
              No results found.
            </div>

            <!-- Results -->
            <SearchResults
              v-else
              :context="context"
              :results="displayResults"
              :news-results="newsResults"
              :settings-results="settingsResults"
              :is-in-watchlist="isInWatchlist"
              @add-to-watchlist="addToWatchlist"
              @remove-from-watchlist="removeFromWatchlist"
              @result-click="handleResultClick"
              @news-click="handleNewsClick"
              @setting-click="handleSettingClick"
            >
              <template #action="{ stock }">
                <button
                  v-if="context === 'holdings'"
                  class="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
                  :class="
                    isInPortfolio(stock)
                      ? 'border-red-500/50 text-red-400 bg-red-500/10'
                      : 'border-green-500/50 text-green-400 bg-green-500/10'
                  "
                  @click.stop="handleAddRemove(stock)"
                >
                  {{ isInPortfolio(stock) ? 'Remove' : 'Add' }}
                </button>
              </template>
            </SearchResults>
          </div>
        </div>

        <!-- Mobile Context Switcher -->
        <SearchContextSwitcher
          class="md:hidden"
          :context="context"
          :options="contextOptions"
          mode="mobile"
          @update:context="setContext"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
.pt-safe {
  padding-top: calc(1rem + env(safe-area-inset-top));
}
</style>
