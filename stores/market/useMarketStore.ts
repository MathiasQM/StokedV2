import { defineStore } from 'pinia'

export type DataRange =
  // | '1d'
  '1w' | '1m' | '3m' | '6m' | 'ytd' | '1y' | '3y' | 'max'

export const useMarketStore = defineStore('market', () => {
  const selectedRange = ref<DataRange>('ytd')

  return { selectedRange }
})
