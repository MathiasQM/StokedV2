import { ref, computed } from 'vue'

export type SearchContext =
  | 'global'
  | 'news'
  | 'holdings'
  | 'settings'
  | 'wishlist'
  | 'stock-search' // Legacy/Specific
  | 'create-portfolio' // Legacy/Specific

export const useCommandPalette = () => {
  const isOpen = useState<boolean>('command-palette-open', () => false)
  const context = useState<SearchContext>(
    'command-palette-context',
    () => 'global',
  )
  const searchQuery = useState<string>('command-palette-query', () => '')

  const openSearch = (initialContext: SearchContext = 'global') => {
    context.value = initialContext
    isOpen.value = true
    // Reset query on open if needed, or keep it
    // searchQuery.value = ''
  }

  const closeSearch = () => {
    isOpen.value = false
  }

  const setContext = (newContext: SearchContext) => {
    context.value = newContext
  }

  return {
    isOpen,
    context,
    searchQuery,
    openSearch,
    closeSearch,
    setContext,
  }
}
