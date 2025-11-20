<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMagicKeys, useDebounceFn } from '@vueuse/core'
import { useSearch } from '@/composables/useSearch'
import {
  useCommandPalette,
  type SearchContext,
} from '@/composables/useCommandPalette'
import { useWatchlist } from '@/composables/useWatchlist'
import { useNewsFeed } from '@/composables/market/useNews'
import { usePortfolio } from '@/composables/usePortfolio'
import type { TickerMeta, NewsItem } from '@@/types/eodhd'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Icon } from '#components'

// --- PROPS & EMITS ---

const props = withDefaults(
  defineProps<{
    context?: 'global' | 'stock-search' | 'create-portfolio'
  }>(),
  {
    context: 'global',
  },
)

const emit = defineEmits<{
  (e: 'create-portfolio'): void
}>()

// Legacy model for specific usages
const selectedStocks = defineModel<TickerMeta[]>('selectedStocks', {
  default: () => [],
})

// Legacy open model, sync with global if context is global
const openModel = defineModel<boolean>('open')

// --- COMPOSABLES ---
const {
  isOpen: globalIsOpen,
  context: globalContext,
  setContext,
  searchQuery: globalSearchQuery,
} = useCommandPalette()
const { search } = useSearch()
const { fetchNews } = useNewsFeed()
const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } =
  useWatchlist()
const { currentPortfolio, removePosition, newPortfolioPositions } =
  usePortfolio() // Note: Add position logic might need adjustment based on real API

// --- STATE ---
const localSearchQuery = ref('')
const stockResults = ref<TickerMeta[]>([])
const newsResults = ref<NewsItem[]>([])
const settingsResults = ref<any[]>([]) // Placeholder for settings
const isLoading = ref(false)

// Sync open state
const isOpen = computed({
  get: () => {
    if (props.context === 'global') return globalIsOpen.value
    return openModel.value || false
  },
  set: (val) => {
    if (props.context === 'global') globalIsOpen.value = val
    openModel.value = val
  },
})

// Active Context
const activeContext = computed({
  get: () => {
    if (props.context !== 'global') return props.context
    return globalContext.value
  },
  set: (val) => {
    if (props.context === 'global') setContext(val as SearchContext)
  },
})

// Search Query
const searchQuery = computed({
  get: () => {
    if (props.context === 'global') return globalSearchQuery.value
    return localSearchQuery.value
  },
  set: (val) => {
    if (props.context === 'global') globalSearchQuery.value = val
    localSearchQuery.value = val
  },
})

// --- SEARCH LOGIC ---

const performSearch = useDebounceFn(async (query: string) => {
  if (query.trim().length < 2) {
    stockResults.value = []
    newsResults.value = []
    settingsResults.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    // 1. Stock Search (Global, Holdings, Wishlist, Stock-Search, Create-Portfolio)
    if (
      [
        'global',
        'holdings',
        'wishlist',
        'stock-search',
        'create-portfolio',
      ].includes(activeContext.value)
    ) {
      stockResults.value = await search(query)
    }

    // 2. News Search
    if (activeContext.value === 'news') {
      // EODHD News Search usually takes tickers, but we might want general search.
      // If the API only supports tickers, we might need to search stocks first then get news,
      // OR use a general news endpoint if available.
      // Assuming fetchNews takes a query string or symbol.
      // The existing useNewsFeed seems to take symbols.
      // For now, let's try to search for stocks and show news for the top match, OR if the API supports text search.
      // If useNewsFeed only takes symbols, we might need to search stocks first.
      // Let's assume we search stocks and show news for them for now, or just search stocks.
      // actually, let's try to use the query directly if the API supports it, otherwise search stocks.
      // Looking at useNewsFeed: fetchNews(symbols, limit).
      // So we probably need to find a stock first.
      const stocks = await search(query)
      if (stocks.length > 0 && stocks[0]?.Code) {
        newsResults.value = await fetchNews(stocks[0].Code)
      } else {
        newsResults.value = []
      }
    }

    // 3. Settings Search
    if (activeContext.value === 'settings') {
      // Mock settings
      const allSettings = [
        { name: 'Profile', link: '/account?tab=settings' },
        { name: 'Security', link: '/account?tab=security' },
        { name: 'Billing', link: '/account?tab=billing' },
        { name: 'Notifications', link: '/account?tab=notifications' },
        { name: 'Appearance', link: '/account?tab=appearance' },
      ]
      settingsResults.value = allSettings.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()),
      )
    }
  } finally {
    isLoading.value = false
  }
}, 300)

watch(searchQuery, (newValue) => {
  if (newValue) {
    performSearch(newValue)
  } else {
    stockResults.value = []
    newsResults.value = []
    settingsResults.value = []
    isLoading.value = false
  }
})

// --- ACTIONS ---

function handleStockClick(stock: TickerMeta) {
  if (activeContext.value === 'global') {
    // Navigate to stock page (placeholder)
    navigateTo(`/market/stock/${stock.Code}`) // Assuming this route exists or will exist
    isOpen.value = false
  } else if (activeContext.value === 'wishlist') {
    toggleWishlist(stock)
  } else if (activeContext.value === 'holdings') {
    // Toggle holding (mock or real)
    // For now, just toast
    console.log('Toggle holding', stock)
  }
}

function toggleWishlist(stock: TickerMeta) {
  if (isInWatchlist(stock)) {
    removeFromWatchlist(stock)
  } else {
    addToWatchlist(stock)
  }
}

// --- KEYBOARD SHORTCUTS ---

const { Meta_J, Ctrl_J } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.key === 'j' && (e.metaKey || e.ctrlKey)) e.preventDefault()
  },
})

watch([Meta_J, Ctrl_J], (v) => {
  if (v[0] || v[1]) {
    isOpen.value = !isOpen.value
  }
})

// --- UI HELPERS ---
const contextOptions = [
  { value: 'global', label: 'Overview', icon: 'i-lucide-search' },
  { value: 'news', label: 'News', icon: 'i-lucide-newspaper' },
  { value: 'holdings', label: 'Holdings', icon: 'i-lucide-briefcase' },
  { value: 'settings', label: 'Settings', icon: 'i-lucide-settings' },
  { value: 'wishlist', label: 'Wishlist', icon: 'i-lucide-heart' },
]

const showContextSwitcher = computed(() => props.context === 'global')
</script>

<template>
  <CommandDialog v-model:open="isOpen">
    <!-- Context Switcher -->
    <div
      v-if="showContextSwitcher"
      class="flex items-center gap-1 p-2 border-b border-border overflow-x-auto no-scrollbar"
    >
      <button
        v-for="opt in contextOptions"
        :key="opt.value"
        @click="activeContext = opt.value as SearchContext"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
        :class="
          activeContext === opt.value
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted text-muted-foreground'
        "
      >
        <Icon :name="opt.icon" class="w-3.5 h-3.5" />
        {{ opt.label }}
      </button>
    </div>

    <!-- Selected Stocks (Create Portfolio Context) -->
    <div
      v-if="context === 'create-portfolio' && selectedStocks.length > 0"
      class="absolute z-10 -top-16 flex gap-2 p-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
    >
      <div
        v-for="stock in selectedStocks"
        :key="`${stock.Code}-${stock.Exchange}`"
        class="flex items-center gap-2 pl-3 pr-2 py-1 bg-muted rounded-full whitespace-nowrap"
      >
        <span class="text-sm font-medium">{{ stock.Code }}</span>
        <button
          class="p-0.5 rounded-full hover:bg-muted-foreground/20"
          @click="selectedStocks = selectedStocks.filter((s) => s !== stock)"
        >
          <Icon name="i-lucide-x" class="h-3 w-3" />
        </button>
      </div>
    </div>

    <CommandInput
      v-model="searchQuery"
      :placeholder="`Search ${activeContext}...`"
      class="h-12 rounded-full border-0 px-4"
    />

    <CommandList>
      <CommandEmpty v-if="!isLoading"> No results found. </CommandEmpty>

      <div
        v-if="isLoading"
        class="p-4 text-sm text-center text-muted-foreground"
      >
        Searching...
      </div>

      <!-- Stock Results -->
      <CommandGroup
        v-if="
          stockResults.length > 0 &&
          [
            'global',
            'holdings',
            'wishlist',
            'stock-search',
            'create-portfolio',
          ].includes(activeContext)
        "
        heading="Stocks"
      >
        <CommandItem
          v-for="stock in stockResults"
          :key="`${stock.Code}-${stock.Exchange}`"
          :value="`${stock.Name} ${stock.Code}`"
          class="flex items-center justify-between w-full px-2 py-3 cursor-pointer"
          @select="handleStockClick(stock)"
        >
          <div class="flex flex-col items-start">
            <div class="font-bold">{{ stock.Code }}</div>
            <div class="text-sm text-muted-foreground">
              {{ stock.Name }} ({{ stock.Exchange }})
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <!-- Wishlist Action -->
            <button
              v-if="activeContext === 'wishlist'"
              class="p-2 rounded-full hover:bg-muted"
              @click.stop="toggleWishlist(stock)"
            >
              <Icon
                :name="
                  isInWatchlist(stock) ? 'i-lucide-heart-off' : 'i-lucide-heart'
                "
                class="w-4 h-4"
                :class="
                  isInWatchlist(stock)
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                "
              />
            </button>

            <!-- Holdings Action (Mock) -->
            <button
              v-if="activeContext === 'holdings'"
              class="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80"
              @click.stop
            >
              Add/Remove
            </button>

            <!-- Create Portfolio Action -->
            <button
              v-if="context === 'create-portfolio'"
              class="ml-4 px-3 py-1 text-xs font-semibold rounded-md transition-colors"
              :class="
                selectedStocks.some((s) => s.Code === stock.Code)
                  ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              "
              @click.stop="
                selectedStocks.some((s) => s.Code === stock.Code)
                  ? (selectedStocks = selectedStocks.filter(
                      (s) => s.Code !== stock.Code,
                    ))
                  : selectedStocks.push(stock)
              "
            >
              {{
                selectedStocks.some((s) => s.Code === stock.Code)
                  ? 'Remove'
                  : 'Add'
              }}
            </button>
          </div>
        </CommandItem>
      </CommandGroup>

      <!-- News Results -->
      <CommandGroup
        v-if="newsResults.length > 0 && activeContext === 'news'"
        heading="News"
      >
        <CommandItem
          v-for="news in newsResults"
          :key="news.date"
          :value="news.title"
          class="flex flex-col items-start gap-1 px-2 py-3 cursor-pointer"
          @select="navigateTo(news.link, { external: true })"
        >
          <div class="font-bold line-clamp-1">{{ news.title }}</div>
          <div class="text-xs text-muted-foreground line-clamp-2">
            {{ news.content }}
          </div>
        </CommandItem>
      </CommandGroup>

      <!-- Settings Results -->
      <CommandGroup
        v-if="settingsResults.length > 0 && activeContext === 'settings'"
        heading="Settings"
      >
        <CommandItem
          v-for="setting in settingsResults"
          :key="setting.name"
          :value="setting.name"
          class="flex items-center justify-between px-2 py-3 cursor-pointer"
          @select="(navigateTo(setting.link), (isOpen = false))"
        >
          <span>{{ setting.name }}</span>
          <Icon
            name="i-lucide-chevron-right"
            class="w-4 h-4 text-muted-foreground"
          />
        </CommandItem>
      </CommandGroup>
    </CommandList>

    <!-- Create Portfolio Footer -->
    <div
      v-if="context === 'create-portfolio' && selectedStocks.length > 0"
      class="p-2 border-t border-border"
    >
      <Button
        @click="(emit('create-portfolio'), (isOpen = false))"
        class="w-full"
      >
        <Icon name="i-lucide-check" class="w-4 h-4 mr-2" />
        Create Portfolio with {{ selectedStocks.length }}
        {{ selectedStocks.length === 1 ? 'stock' : 'stocks' }}
      </Button>
    </div>
  </CommandDialog>
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
