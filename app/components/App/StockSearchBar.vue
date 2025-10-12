<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/composables/useSearch'
import type { TickerMeta } from '@@/types/eodhd'
import { useDebounceFn } from '@vueuse/core'

const emit = defineEmits<{
  (e: 'add', stock: TickerMeta): void
}>()

const { search } = useSearch()

const searchQuery = ref('')
const searchResults = ref<TickerMeta[]>([])
const isLoading = ref(false)
const hasSearched = ref(false)

const performSearch = useDebounceFn(async (query: string) => {
  if (query.trim().length < 2) {
    searchResults.value = []
    isLoading.value = false
    return
  }
  isLoading.value = true
  hasSearched.value = true
  try {
    searchResults.value = await search(query)
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}, 300) // 300ms debounce

watch(searchQuery, (newValue) => {
  performSearch(newValue)
})

function handleAddStock(stock: TickerMeta) {
  console.log('from search', stock)
  emit('add', stock)
  // Reset search state after selection
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
}
</script>

<template>
  <div class="relative w-full">
    <Icon
      name="i-lucide-search"
      class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
    />
    <Input
      v-model="searchQuery"
      placeholder="Search Apple or AAPL..."
      size="xl"
      class="w-full pl-9 bg-neutral-950 h-12"
    />
    <div
      v-if="searchQuery.length > 1"
      class="absolute bottom-full mb-2 w-full max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-md shadow-lg z-10"
    >
      <div v-if="isLoading" class="p-4 text-center text-muted-foreground">
        Searching...
      </div>
      <ul v-else-if="searchResults.length > 0">
        <li
          v-for="stock in searchResults"
          :key="`${stock.Code}-${stock.Exchange}`"
          class="px-4 py-2 hover:bg-zinc-800 cursor-pointer"
          @click="handleAddStock(stock)"
        >
          <div class="font-bold">{{ stock.Code }}</div>
          <div class="text-sm text-muted-foreground truncate">
            {{ stock.Name }} ({{ stock.Exchange }})
          </div>
        </li>
      </ul>
      <div
        v-else-if="hasSearched"
        class="p-4 text-center text-muted-foreground"
      >
        No results found.
      </div>
    </div>
  </div>
</template>
