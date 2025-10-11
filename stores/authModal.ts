import { defineStore } from 'pinia'

export type AuthView = 'login' | 'register' | 'magic-link' | 'error'

export const useAuthModal = defineStore('authModal', () => {
  const open = ref(false)

  const view = ref<AuthView>('login')

  function openAuthModal(initialView: AuthView = 'login') {
    console.log('using auth modal store to open modal')
    view.value = initialView
    open.value = true
  }

  function closeAuthModal() {
    open.value = false
  }

  function setView(newView: AuthView) {
    view.value = newView
  }

  return {
    open,
    view,
    openAuthModal,
    closeAuthModal,
    setView,
  }
})
