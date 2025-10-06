import { link } from '#build/ui'
import { defineStore } from 'pinia'
import { usePlaidLink } from '~/composables/usePlaidLink'
import type { ConnectedInstitution } from '~~/types/plaid'
type PlaidItem = {
  itemId: string
  institutionId: string
  token: string
  products: string[]
}

export const usePlaidStore = defineStore('plaid', () => {
  const plaidItems = ref<PlaidItem[]>([])
  const linkToken = ref<string | null>(null)
  const accounts = ref<Plaid.AccountBase[]>([])
  const connectedInstitutions = ref<ConnectedInstitution[]>([])
  const cursor = ref<string | null>(null) // for incremental sync
  const txns = ref<Plaid.Transaction[]>([])
  const hasItems = ref<boolean>(false)
  const { user } = useUserSession()
  const toast = useToast()

  async function checkHasItem() {
    if (hasItems.value || import.meta.server) return true
    const res = await $fetch('/api/plaid/has-item')
    plaidItems.value = res as PlaidItem[]
    hasItems.value = plaidItems.value.length > 0
    return hasItems.value
  }

  async function connectBank({
    institutionId,
    country,
    provider,
  }: {
    institutionId?: string
    country?: string
    provider?: string
  }) {
    await checkHasItem()

    const existing = institutionId
      ? plaidItems.value.find((it) => it.institutionId === institutionId)
      : undefined

    const { linkToken } = await $fetch('/api/plaid/createLinkToken', {
      method: 'POST',
      body: {
        accessToken: existing?.token || null,
      },
    })

    const { publicToken, institutionId: pickedId } =
      await usePlaidLink(linkToken)

    // Detect duplicate institutions and prevent re-adding
    if (!existing && pickedId) {
      const dup = plaidItems.value.find((i) => i.institutionId === pickedId)
      if (dup) {
        console.error('Institution already connected:', dup.institutionId)
        toast.add({
          title: 'Institution already connected',
          description: 'Use the existing connection instead.',
          color: 'warning',
        })
        return
      }
    }

    await $fetch('/api/plaid/exchangePublicToken', {
      method: 'POST',
      body: { publicToken, country, provider },
    })
    await refreshAccounts()
  }

  async function refreshAccounts() {
    const res = await $fetch('/api/plaid/accounts')

    accounts.value = res.accounts
  }

  const fetchConnectedInstitutions = async (): Promise<void> => {
    const res = await $fetch('/api/plaid/connected-institutions')

    connectedInstitutions.value = res.institutions as ConnectedInstitution[]
  }

  const syncTxns = async () => {
    const { data } = await $fetch('/api/plaid/transactions-sync', {
      query: { accessToken: 'demo-access', cursor: cursor.value },
    })
    txns.value.push(...data.added)
    cursor.value = data.next_cursor
  }

  return {
    linkToken,
    accounts,
    connectedInstitutions,
    txns,
    hasItems,
    connectBank,
    refreshAccounts,
    fetchConnectedInstitutions,
    syncTxns,
    checkHasItem,
  }
})
