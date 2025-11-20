<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useSearch } from '@/composables/useSearch'
import { useNewsFeed } from '@/composables/market/useNews'
import { useDebounceFn, onKeyStroke, useLocalStorage } from '@vueuse/core'
import type { TickerMeta, NewsItem } from '@@/types/eodhd'
import { useFundamentals } from '@/composables/market/useFundamentals'
import { useWatchlist } from '@/composables/useWatchlist'
import { usePortfolio } from '@/composables/usePortfolio'
import type { Position } from '~~/types/portfolios'

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
  // Remove if already exists to avoid duplicates
  const existingIndex = searchHistory.value.findIndex(
    (item) => item.Code === stock.Code && item.Exchange === stock.Exchange,
  )
  if (existingIndex !== -1) {
    searchHistory.value.splice(existingIndex, 1)
  }
  // Add to beginning
  searchHistory.value.unshift(stock)
  // Limit to 10
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

// --- Portfolio Logic ---
const portfolioPositions = ref<Position[]>([])
watch(
  () => context.value,
  async (newContext) => {
    if (newContext === 'holdings' && currentPortfolio.value?.id) {
      portfolioPositions.value = await getPositions()
    }
    // Reset filter on context change
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
    // 1. Stock Search (Global, Holdings, Wishlist)
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
      rawResults.value = results.slice(0, 20) // Limit to 20 items
    }

    // 2. News Search
    if (context.value === 'news') {
      // News search typically requires a ticker. We search for stocks first, then get news for the top result.
      const stocks = await search(q)
      if (stocks.length > 0 && stocks[0]?.Code) {
        newsResults.value = await fetchNews(stocks[0].Code)
      } else {
        newsResults.value = []
      }
    }

    // 3. Settings Search
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

// --- Logos ---
const resultSymbols = computed(() => {
  const historySymbols = searchHistory.value.map(
    (s) => `${s.Code}.${s.Exchange || 'US'}`,
  )
  const searchSymbols = rawResults.value.map(
    (s) => `${s.Code}.${s.Exchange || 'US'}`,
  )
  return [...new Set([...historySymbols, ...searchSymbols])]
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
        // Default to global if opening via shortcut
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

// Context Options (Reordered)
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
          class="flex items-center gap-3 p-4 md:hidden w-full border-b border-white/10 bg-black"
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

          <!-- Desktop Context Switcher & Filters (Hidden on Mobile) -->
          <div
            class="hidden md:flex flex-col border-b border-white/10 bg-white/5"
          >
            <!-- Contexts -->
            <div
              class="flex items-center gap-1 px-4 py-2 border-b border-white/5"
            >
              <button
                v-for="opt in contextOptions"
                :key="opt.value"
                @click="setContext(opt.value as any)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                :class="
                  context === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                "
              >
                <Icon :name="opt.icon" class="w-3.5 h-3.5" />
                {{ opt.label }}
              </button>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2 px-4 py-2">
              <button
                v-for="filter in currentFilters"
                :key="filter"
                @click="activeFilter = filter"
                class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
                :class="
                  activeFilter === filter
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                "
              >
                {{ filter }}
              </button>
            </div>
          </div>

          <!-- Mobile Filters (Visible on Mobile, Hidden on Desktop) -->
          <div
            class="md:hidden flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/10 bg-black"
          >
            <button
              v-for="filter in currentFilters"
              :key="filter"
              @click="activeFilter = filter"
              class="px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap"
              :class="
                activeFilter === filter
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white'
              "
            >
              {{ filter }}
            </button>
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
              <div v-if="searchHistory.length > 0">
                <div class="flex items-center justify-between px-2 mb-2">
                  <h3 class="text-xs font-semibold text-white/40 uppercase">
                    Recent Searches
                  </h3>
                  <button
                    @click="clearHistory"
                    class="text-xs text-white/40 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div class="flex flex-col gap-1">
                  <div
                    v-for="item in searchHistory"
                    :key="item.Code"
                    class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer group"
                    @click="handleResultClick(item)"
                  >
                    <div class="flex items-center gap-3">
                      <Icon
                        name="i-lucide-clock"
                        class="w-4 h-4 text-white/40"
                      />
                      <div class="text-white font-medium">{{ item.Code }}</div>
                      <div class="text-white/60 text-xs">{{ item.Name }}</div>
                    </div>
                    <button
                      @click.stop="removeFromHistory(item)"
                      class="text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon name="i-lucide-x" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
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
            <div v-else class="flex flex-col gap-6 pb-20 md:pb-0">
              <!-- News Results -->
              <div v-if="context === 'news' && newsResults.length">
                <div class="flex flex-col gap-2">
                  <div
                    v-for="news in newsResults"
                    :key="news.date"
                    class="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-white/5"
                    @click="handleNewsClick(news)"
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
                    @click="handleSettingClick(setting)"
                  >
                    <span class="text-sm text-white">{{ setting.name }}</span>
                    <Icon
                      name="i-lucide-chevron-right"
                      class="w-4 h-4 text-white/40"
                    />
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
                <div v-if="displayResults.stocks?.length">
                  <h3
                    class="text-xs font-semibold text-white/40 uppercase mb-3 px-2"
                  >
                    Stocks
                  </h3>
                  <div class="flex flex-col gap-2">
                    <div
                      v-for="stock in displayResults.stocks"
                      :key="stock.Code"
                      class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer group"
                      @click="handleResultClick(stock)"
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
                              isInWatchlist(stock)
                                ? 'i-lucide-heart'
                                : 'i-lucide-heart'
                            "
                            class="w-5 h-5"
                            :class="
                              isInWatchlist(stock)
                                ? 'text-red-500 fill-current'
                                : 'text-white/40'
                            "
                          />
                        </button>
                        <button
                          v-if="context === 'holdings'"
                          class="px-3 py-1 text-xs font-medium rounded-full border transition-colors"
                          :class="
                            isInPortfolio(stock)
                              ? 'border-red-500/50 text-red-400 bg-red-500/10'
                              : 'border-green-500/50 text-green-400 bg-green-500/10'
                          "
                          @click="handleAddRemove(stock)"
                        >
                          {{ isInPortfolio(stock) ? 'Remove' : 'Add' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ETFs -->
                <div v-if="displayResults.etfs?.length">
                  <h3
                    class="text-xs font-semibold text-white/40 uppercase mb-3 px-2"
                  >
                    ETFs
                  </h3>
                  <div class="flex flex-col gap-2">
                    <div
                      v-for="stock in displayResults.etfs"
                      :key="stock.Code"
                      class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer"
                      @click="handleResultClick(stock)"
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
                <div v-if="displayResults.funds?.length">
                  <h3
                    class="text-xs font-semibold text-white/40 uppercase mb-3 px-2"
                  >
                    Funds
                  </h3>
                  <div class="flex flex-col gap-2">
                    <div
                      v-for="stock in displayResults.funds"
                      :key="stock.Code"
                      class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer"
                      @click="handleResultClick(stock)"
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
          </div>
        </div>

        <!-- Mobile Context Switcher (Floating above keyboard) -->
        <div
          class="md:hidden fixed bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black to-transparent pb-safe z-50"
          @click.stop
        >
          <div
            class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2"
          >
            <button
              v-for="opt in contextOptions"
              :key="opt.value"
              @click="setContext(opt.value as any)"
              class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap backdrop-blur-md border border-white/10 shadow-lg"
              :class="
                context === opt.value
                  ? 'bg-white text-black'
                  : 'bg-black/80 text-white'
              "
            >
              <Icon :name="opt.icon" class="w-4 h-4" />
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
</style>
