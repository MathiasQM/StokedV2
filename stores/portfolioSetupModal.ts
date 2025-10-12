import { defineStore } from 'pinia'

export const usePortfolioSetupModal = defineStore('portfolioSetupModal', () => {
  const open = ref(false)

  const view = ref('setup')

  function openPortfolioSetupModal(initialView = 'setup') {
    view.value = initialView
    open.value = true
  }

  function closePortfolioSetupModal() {
    open.value = false
  }

  function setView(newView) {
    view.value = newView
  }

  return {
    open,
    view,
    openPortfolioSetupModal,
    closePortfolioSetupModal,
    setView,
  }
})
