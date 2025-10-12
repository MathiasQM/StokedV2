<script setup lang="ts">
import type { Subscription } from '~~/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { checkLimit } from '~~/helpers/subscription-limits'
import type { SubscriptionWithProduct } from '~~/server/database/queries/subscriptions'
import { usePortfolio } from '@/composables/usePortfolio'

const { $dayjs } = useNuxtApp()
const { user, fetch: refreshSession } = useUserSession()
const { portfolios, ownedPortfolios, deletePortfolio } = usePortfolio()

const selectedIds = ref<string[]>([])

const { data: activeSubscription, refresh: refreshSubscription } =
  await useAsyncData('active-subscription', async () => {
    if (!user.value?.id) return null
    try {
      const fetchedData = await $fetch<SubscriptionWithProduct>(
        '/api/stripe/subscription',
        {
          query: { userId: user.value.id, includeProduct: true },
        },
      )
      return fetchedData
    } catch (error) {
      console.error('Failed to fetch active subscription:', error)
      return null
    }
  })

const { limit, currentCount } = checkLimit(
  activeSubscription?.value?.price?.product?.id,
  'ownedPortfolios',
  ownedPortfolios?.length,
  activeSubscription?.value?.plan,
)

const isDialogOpen = computed((): boolean => {
  return (
    currentCount > limit &&
    activeSubscription.value?.promptPortfolioModal &&
    $dayjs().isSameOrAfter(activeSubscription.value?.switchScheduledAt)
  )
})

const disableMore = computed(() => selectedIds.value.length >= limit)

const updateSubscription = async () => {
  console.log('selectedIds right now →', activeSubscription.value)
  try {
    await $fetch('/api/stripe/subscription-update', {
      method: 'POST',
      body: { subscriptionId: activeSubscription.value?.id },
    })

    await refreshSubscription()
  } catch (err) {
    console.error('auto-clear failed', err)
  }
}

const onSubmit = async (e: Event) => {
  e.preventDefault()
  const formData = new FormData(e.target as HTMLFormElement)
  const selectedPortfolios = formData.getAll('items') as string[]

  if (selectedPortfolios.length > limit) {
    alert(`You can only select up to ${limit} portfolios.`)
    return
  }

  try {
    for (const id of selectedIds.value) {
      if (!selectedPortfolios.includes(id)) {
        await deletePortfolio(id)
      }
    }
  } catch (err) {
    console.error('Failed to update subscription:', err)
  } finally {
    await updateSubscription()
    await refreshSession()
  }
}

const needsAutoUpdate = computed(
  () =>
    currentCount <= limit &&
    $dayjs().isSameOrAfter(activeSubscription.value?.switchScheduledAt),
)

watch(
  needsAutoUpdate,
  async (now, was) => {
    if (now && !was && activeSubscription.value) {
      await updateSubscription()
    }
  },
  { immediate: true },
)
const toggle = (id: string, state: boolean) => {
  if (state) {
    if (!selectedIds.value.includes(id)) selectedIds.value.push(id)
  } else {
    selectedIds.value = selectedIds.value.filter((i) => i !== id)
  }
}
</script>
<template>
  <Dialog v-model:open="isDialogOpen">
    <DialogContent
      class="max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto] p-0 sm:max-w-[425px]"
    >
      <DialogHeader class="p-6 pb-0">
        <DialogTitle>Choose active portfolios</DialogTitle>
        <DialogDescription>
          Your downgrade to the
          <strong>{{ activeSubscription?.price?.product?.name }}</strong> plan
          has been processed. You exceed the number of portfolios allowed in
          this plan.
        </DialogDescription>
      </DialogHeader>
      <div class="px-6">
        <div class="mb-4">
          <p class="text-md font-medium">Select active portfolios</p>
          <p class="text-sm">
            Select up to {{ limit }} portfolio to active or revert downgrade.
          </p>
        </div>
        <form @submit="onSubmit">
          <div v-for="p in portfolios" :key="p.id" class="flex items-center">
            <Checkbox
              class="disabled:opacity-5"
              :checked="selectedIds.includes(p.id)"
              @update:model-value="(val) => toggle(p.id, val)"
              :disabled="disableMore && !selectedIds.includes(p.id)"
              :id="p.id"
            />
            <label
              :for="p.id"
              class="ml-2 cursor-pointer select-none"
              :class="
                disableMore && !selectedIds.includes(p.id) ? 'opacity-30' : ''
              "
            >
              {{ p.name }}
            </label>
          </div>

          <DialogFooter class="mt-10 flex">
            <Button
              type="submit"
              :disabled="selectedIds.length === 0"
              class="flex-1 bg-orange-500 text-white hover:bg-orange-400"
            >
              Confirm selection
            </Button>
          </DialogFooter>
        </form>
      </div>
    </DialogContent>
  </Dialog>
</template>
