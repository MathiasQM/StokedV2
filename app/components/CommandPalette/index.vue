<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMagicKeys, useDebounceFn } from '@vueuse/core'
import { useSearch } from '@/composables/useSearch'
import type { TickerMeta } from '@@/types/eodhd'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Icon } from '#components' // Assuming you use nuxt-icon

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

const selectedStocks = defineModel<TickerMeta[]>('selectedStocks', {
  default: () => [],
})

const open = defineModel<boolean>('open', { required: true })

// --- STOCK SEARCH LOGIC ---

const { search } = useSearch()
const searchQuery = ref('')
const searchResults = ref<TickerMeta[]>([])
const isLoading = ref(false)

const performSearch = useDebounceFn(async (query: string) => {
  if (
    props.context === 'global' ||
    props.context === 'stock-search' ||
    props.context === 'create-portfolio'
  ) {
    if (query.trim().length < 2) {
      searchResults.value = []
      isLoading.value = false
      return
    }
    isLoading.value = true
    try {
      searchResults.value = await search(query)
    } finally {
      isLoading.value = false
    }
  }
}, 300)

watch(searchQuery, (newValue) => {
  if (newValue) {
    performSearch(newValue)
  } else {
    searchResults.value = []
    isLoading.value = false
  }
})

// --- SELECTION LOGIC ---

/** 2. Checks if a stock is already in the selected list. */
function isStockSelected(stock: TickerMeta): boolean {
  return selectedStocks.value.some(
    (s) => s.Code === stock.Code && s.Exchange === stock.Exchange,
  )
}

/** 3. Adds or removes a stock from the v-model array. */
function toggleStockSelection(stock: TickerMeta) {
  if (isStockSelected(stock)) {
    // Remove the stock
    selectedStocks.value = selectedStocks.value.filter(
      (s) => !(s.Code === stock.Code && s.Exchange === stock.Exchange),
    )
  } else {
    // Add the stock
    selectedStocks.value = [...selectedStocks.value, stock]
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
    open.value = !open.value
  }
})

const showStockResults = computed(() => {
  return (
    (props.context === 'global' ||
      props.context === 'stock-search' ||
      props.context === 'create-portfolio') &&
    searchQuery.value.length > 1
  )
})

function handleCreatePortfolioClick() {
  emit('create-portfolio')
  open.value = false // Close the command palette
}
</script>

<template>
  <CommandDialog v-model:open="open">
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
          @click="toggleStockSelection(stock)"
        >
          <Icon name="i-lucide-x" class="h-3 w-3" />
        </button>
      </div>
    </div>

    <CommandInput
      v-model="searchQuery"
      placeholder="Search for stocks..."
      class="h-12 rounded-full border-0 px-4"
    />
    <CommandList>
      <CommandEmpty v-if="!isLoading"> No results found. </CommandEmpty>

      <CommandGroup v-if="showStockResults" heading="Stocks">
        <div
          v-if="isLoading"
          class="p-4 text-sm text-center text-muted-foreground"
        >
          Searching for tickers...
        </div>
        <CommandItem
          v-for="stock in searchResults"
          :key="`${stock.Code}-${stock.Exchange}`"
          :value="`${stock.Name} ${stock.Code}`"
          class="flex items-center justify-between w-full px-2 py-3"
          @select.prevent=""
        >
          <div class="flex flex-col items-start">
            <div class="font-bold">
              {{ stock.Code }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ stock.Name }} ({{ stock.Exchange }})
            </div>
          </div>

          <button
            v-if="context === 'create-portfolio'"
            class="ml-4 px-3 py-1 text-xs font-semibold rounded-md transition-colors"
            :class="
              isStockSelected(stock)
                ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            "
            @click.stop="toggleStockSelection(stock)"
          >
            {{ isStockSelected(stock) ? 'Remove' : 'Add' }}
          </button>
        </CommandItem>
      </CommandGroup>

      <template v-if="context === 'global' && !showStockResults"> </template>
    </CommandList>
    <div
      v-if="context === 'create-portfolio' && selectedStocks.length > 0"
      class="p-2 border-t border-border"
    >
      <Button @click="handleCreatePortfolioClick" class="w-full">
        <Icon name="i-lucide-check" class="w-4 h-4 mr-2" />
        Create Portfolio with {{ selectedStocks.length }}
        {{ selectedStocks.length === 1 ? 'stock' : 'stocks' }}
      </Button>
    </div>
  </CommandDialog>
</template>
