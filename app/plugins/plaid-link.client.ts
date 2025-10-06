import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  const id = 'plaid-link-sdk'
  if (document.getElementById(id)) return

  const script = document.createElement('script')
  script.id = id
  script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
  script.async = true
  document.head.appendChild(script)
})
