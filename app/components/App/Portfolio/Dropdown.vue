<template>
  <div>
    <UDropdownMenu
      v-if="portfolios.length > 0"
      :items="items"
      :ui="{
        label: 'Portfolio',
        content: 'w-[240px] ml-2',
        item: 'cursor-pointer',
        itemTrailingIcon: 'size-4',
      }"
    >
      <div class="flex items-center gap-2 md:mt-2">
        <div class="flex-1 flex-col items-center gap-2">
          <UButton
            :label="
              portfolios.length > 0
                ? currentPortfolio?.name
                : 'Sync a new portfolio'
            "
            color="orange"
            variant="subtle"
            class="w-full max-w-32 overflow-hidden text-ellipsis whitespace-nowrap hover:bg-neutral-200/80 sm:max-w-full dark:hover:bg-white/10"
            block
            trailing-icon="i-lucide-chevrons-up-down"
            :ui="{ trailingIcon: 'size-4' }"
          />
        </div>
      </div>
    </UDropdownMenu>
    <UButton
      v-else
      :label="
        portfolios.length > 0 ? currentPortfolio?.name : 'Create portfolio'
      "
      @click="handleCreateNewPortfolio()"
      variant="soft"
      class="w-full bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white"
      block
      trailing-icon="i-lucide-link"
      :ui="{ trailingIcon: 'size-4' }"
    />

    <AppPortfolioLimitDropdown
      v-model:upradeModal="upradeModal"
      :activeSubscription="activeSubscription"
      :currentPlan="currentPlan"
    />
  </div>
</template>

<script lang="ts" setup>
import { AppPortfolioLimitDropdown } from '#components'
import { checkLimit, type PlanId } from '~~/helpers/subscription-limits'
import type { ExpandedSubscription } from '@/composables/useSubscription'
import { usePortfolio } from '@/composables/usePortfolio'
import { useAuthModal } from '~~/stores/authModal'
import { usePortfolioSetupModal } from '~~/stores/portfolioSetupModal'

const authStore = useAuthModal()
const portfolioSetupModal = usePortfolioSetupModal()
const { loggedIn } = useUserSession()
const route = useRoute()
const { activeSubscription, currentPlan, fetchActive } = useSubscription()
const activeSubExpanded = activeSubscription as Ref<ExpandedSubscription | null>
onMounted(async () => {
  if (!activeSubscription.value) {
    await fetchActive()
    await getMemberships()
  }
})

const { currentPortfolio, portfolios, ownedPortfolios, getMemberships } =
  usePortfolio()

const { setLastUsedPortfolio } = usePortfolioPreferences()
const upradeModal = ref(false)

async function handleCreateNewPortfolio() {
  if (!loggedIn.value) return authStore.openAuthModal()
  if (portfolios.value.length === 0)
    return portfolioSetupModal.openPortfolioSetupModal()
  const effectivePortfolioCount = ownedPortfolios.length + 1
  const { isAllowed, exceededBy, limit, currentCount, label } = checkLimit(
    activeSubExpanded.value?.price?.product?.id as PlanId,
    'ownedPortfolios',
    effectivePortfolioCount,
    0,
  )

  if (!isAllowed) {
    return (upradeModal.value = true)
  }

  portfolioSetupModal.openPortfolioSetupModal()
}

const items = computed(() => {
  if (!portfolios.value) return []

  const allPortfolios = portfolios.value.map((portfolio) => ({
    label: portfolio.name,
    avatar: {
      src: portfolio.logo as string,
      size: '2xs' as const,
    },
    type: 'checkbox' as const,
    checked: portfolio.slug === currentPortfolio.value?.slug,
    onSelect: async (e: Event) => {
      setLastUsedPortfolio(portfolio.slug)
      currentPortfolio.value = portfolios.value.find(
        (p) => p.id === portfolio.id,
      )

      if (route.path.includes('/dashboard'))
        await navigateTo(`/dashboard/${portfolio.slug}`, { replace: true })
    },
  }))

  return [
    [...allPortfolios],
    [
      {
        label: 'Create a new portfolio',
        icon: 'i-lucide-plus-circle',
        onSelect: () => {
          handleCreateNewPortfolio()
        },
      },
    ],
  ]
})
</script>
