import { loadStripe, type Stripe } from '@stripe/stripe-js'
import type { Price, Product, Subscription } from '@@/types/database'

const STRIPE = {
  plans: '/api/stripe/plans',
  checkout: '/api/stripe/checkout',
  portal: '/api/stripe/portal',
  cancelDowngrade: '/api/stripe/cancel-downgrade',
  subscription: '/api/stripe/subscription',
  subscriptionUpdate: '/api/stripe/subscription-update', // only if you need it
} as const

function sleep(ms = 1200) {
  return new Promise((r) => setTimeout(r, ms))
}

const formatPrice = (price?: number): string => {
  if (!price) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price / 100)
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'trialing':
      return 'primary'

    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      return 'error'
    case 'past_due':
    case 'incomplete':
      return 'warning'
    default:
      return 'neutral'
  }
}

const getSubscriptionMessage = (plan: BillingPlan) => {
  if (plan.cancelAt) {
    return 'Cancels on'
  }
  if (plan.status === 'trialing') {
    return 'Trial ends on'
  }
  return 'Renews on'
}

type BillingInterval = 'monthly' | 'yearly'

interface GroupedPlan {
  product: Product
  plans: Partial<Record<BillingInterval, Price>>
}

interface BillingPlan {
  id: string
  name: string
  description: string
  status?: string
  currentPeriodEnd?: Date
  currentPeriodStart?: Date
  amount: number
  interval: string
  priceId: string
  cancelAt?: Date
}

interface ExpandedSubscription extends Subscription {
  expand: {
    price_id: Price
  }
}

export const useSubscription = () => {
  const { user, fetch: refreshUser } = useUserSession()
  const runtimeConfig = useRuntimeConfig()
  const stripe = shallowRef<Stripe | null>(null)

  const plans = useState<Price[]>('stripe-plans', () => [])
  const activeSubscription = useState<
    Subscription | ExpandedSubscription | null
  >('active-sub', () => null)
  const loading = ref(false)

  onMounted(async () => {
    if (import.meta.client && !stripe.value) {
      stripe.value = await loadStripe(runtimeConfig.public.stripePublicKey)
    }
    if (!plans.value.length) await fetchPlans()
    if (!activeSubscription.value) await fetchActive()
  })

  async function fetchPlans() {
    const { data, error } = await useFetch<Price[]>(STRIPE.plans)
    if (error.value) throw error.value
    plans.value = data.value ?? []
    return plans.value
  }

  async function fetchActive() {
    if (!user.value?.id) return null

    const { data, error } = await useFetch<ExpandedSubscription>(
      STRIPE.subscription,
      {
        query: { userId: user.value.id },
      },
    )

    if (error.value) throw error.value
    activeSubscription.value = data.value ?? null
    return activeSubscription.value
  }

  const groupedPlans = computed<GroupedPlan[]>(() => {
    const map = new Map<string, GroupedPlan>()
    for (const p of plans.value) {
      const id = p.productId
      let entry = map.get(id)
      if (!entry) {
        entry = { product: p.product, plans: {} }
        map.set(id, entry)
      }
      if (p.interval === 'month') entry.plans.monthly = p
      if (p.interval === 'year') entry.plans.yearly = p
    }
    return [...map.values()]
  })

  const currentPlan = computed<BillingPlan>(() => {
    if (!activeSubscription.value?.priceId || !plans.value) {
      return {
        id: '',
        name: 'Free plan',
        description: '',
        amount: 0,
        interval: '',
        priceId: '',
      } as BillingPlan
    }
    const price = plans.value.find(
      (p) => p.id === activeSubscription.value!.priceId,
    )
    if (!price) throw createError('Invalid plan configuration')
    return {
      id: price.id,
      name: price.product.name || 'Unknown',
      description: price.product.description || '',
      status: activeSubscription.value!.status,
      currentPeriodEnd: activeSubscription.value!.currentPeriodEnd,
      currentPeriodStart: activeSubscription.value!.currentPeriodStart,
      amount: price.unitAmount,
      interval: price.interval,
      priceId: price.id,
      cancelAt: activeSubscription.value!.cancelAt,
    } as BillingPlan
  })

  async function refresh({ tries = 6, delay = 1500 } = {}) {
    loading.value = true
    for (let i = 0; i < tries; i++) {
      await fetchActive()
      if (!activeSubscription.value?.pendingPriceId) break
      await sleep(delay)
    }
    loading.value = false
  }

  async function subscribe(priceId: string) {
    const toast = useToast()

    if (activeSubscription.value?.pendingPriceId) {
      return toast.add({
        title: 'Downgrade pending',
        description: 'Cancel or wait for the pending change first.',
        color: 'warning',
      })
    }

    try {
      loading.value = true
      if (!user.value?.id) throw new Error('User not logged in')

      const res = await $fetch(STRIPE.checkout, {
        method: 'POST',
        body: { priceId, userId: user.value.id },
      })

      if (!res.success) throw new Error('Stripe checkout failed')

      if (res.url) window.open(res.url, '_blank')

      if (res.decision === 'immediate' && res.clientSecret && stripe.value) {
        const { error } = await stripe.value.confirmCardPayment(
          res.clientSecret,
        )
        if (error) throw error
        toast.add({
          title: 'Success!',
          description: 'Plan will be updated 🎉. This might take a minute',
        })
      }

      if (res.decision === 'scheduled') {
        toast.add({
          title: 'Scheduled',
          description: 'Plan will change on renewal.',
        })
      }

      if (res.decision === 'none') {
        toast.add({
          title: 'No change',
          description: 'Youʼre already on that plan',
          color: 'error',
        })
      }
    } catch (err: any) {
      toast.add({
        title: 'Stripe error',
        description: err.message ?? 'Unexpected',
        color: 'error',
      })
      throw err
    } finally {
      loading.value = false
      await refreshUser()
      await refresh()
    }
  }

  async function managePortal() {
    const toast = useToast()

    try {
      loading.value = true
      if (!user.value?.id) throw new Error('User not logged in')
      const url = await $fetch<string>(STRIPE.portal, {
        method: 'POST',
        body: { userId: user.value.id },
      })

      if (!url) {
        throw new Error('No portal URL returned from the server')
      }

      window.location.href = url
    } catch (err: any) {
      toast.add({
        title: 'Portal error',
        description: err.message ?? 'Unexpected',
        color: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  async function cancelDowngrade(subscriptionId: string) {
    const toast = useToast()

    try {
      loading.value = true
      await $fetch(STRIPE.cancelDowngrade, {
        method: 'POST',
        body: { subscriptionId },
      })
      toast.add({
        title: 'Downgrade canceled',
        description: 'Your plan remains unchanged.',
      })
    } catch (err: any) {
      toast.add({
        title: 'Error',
        description: err.message ?? 'Unexpected',
        color: 'error',
      })
      throw err
    } finally {
      loading.value = false
      await refreshUser()
      await refresh()
    }
  }

  return {
    /* reactive state */
    loading,
    plans,
    groupedPlans,
    activeSubscription,
    currentPlan,

    /* actions */
    fetchPlans,
    fetchActive,
    subscribe,
    managePortal,
    cancelDowngrade,
    refresh,

    /* stateless helpers */
    formatPrice,
    getStatusColor,
    getSubscriptionMessage,
  }
}
