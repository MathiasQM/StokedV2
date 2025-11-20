import { ref } from 'vue'
import type { TickerMeta } from '@@/types/eodhd'

export const useWatchlist = () => {
  // Persist to local storage for now, or just state if no backend
  // Using useState for global state across components
  const watchlist = useState<TickerMeta[]>('user-watchlist', () => [])

  // Initialize from local storage on client side if needed
  // For now, just in-memory state is fine as per requirements "add to wishlists" implies local or simple management first

  const addToWatchlist = (stock: TickerMeta) => {
    if (!isInWatchlist(stock)) {
      watchlist.value.push(stock)
      // TODO: Persist to backend/localstorage
    }
  }

  const removeFromWatchlist = (stock: TickerMeta) => {
    watchlist.value = watchlist.value.filter(
      (s) => !(s.Code === stock.Code && s.Exchange === stock.Exchange),
    )
    // TODO: Persist
  }

  const isInWatchlist = (stock: TickerMeta) => {
    return watchlist.value.some(
      (s) => s.Code === stock.Code && s.Exchange === stock.Exchange,
    )
  }

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  }
}
