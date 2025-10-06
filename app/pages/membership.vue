<template>
  <AppContainer title="Membership">
    <!-- CURRENT STATUS ------------------------------------------------------------------- -->
    <div
      class="flex h-auto flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="flex flex-col space-y-4">
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <!-- Left side: status text -->
          <div class="space-y-2">
            <template v-if="activeSubscription">
              <h3 class="text-lg font-medium">
                You are on
                <span class="font-bold">{{ currentPlan.name }}</span> plan
              </h3>

              <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-2">
                  <span class="text-xl font-semibold">{{
                    formatPrice(currentPlan.amount)
                  }}</span>
                  <span class="text-neutral-500"
                    >every {{ currentPlan.interval }}</span
                  >
                </div>

                <UBadge
                  :label="currentPlan.status"
                  :color="getStatusColor(currentPlan.status)"
                  variant="subtle"
                  class="capitalize"
                />

                <span class="text-sm text-neutral-500">
                  {{ getSubscriptionMessage(currentPlan) }}
                  {{
                    useDateFormat(
                      currentPlan.cancelAt || currentPlan.currentPeriodEnd,
                      'MMM DD, YYYY',
                    )
                  }}
                </span>

                <div v-if="activeSubscription.pendingSwitch">
                  <UBadge
                    label="Pending downgrade"
                    color="warning"
                    variant="subtle"
                    class="capitalize"
                  />
                  <span class="text-sm text-neutral-500">
                    You’ve chosen to downgrade. Changes apply at the billing
                    period’s end.
                  </span>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Cancel Downgrade"
                    @click="handleCancelDowngrade(activeSubscription.id)"
                  />
                </div>
              </div>
            </template>

            <template v-else>
              <h3 class="text-lg font-medium">
                You are on the <span class="font-bold">Free</span> plan
              </h3>
              <p class="text-sm text-neutral-500">
                Upgrade to a paid plan to unlock more features and higher usage
                limits.
              </p>
            </template>
          </div>

          <!-- Right side: portal btn -->
          <UButton
            v-if="activeSubscription"
            color="neutral"
            variant="outline"
            label="Manage Subscription"
            :loading="loading"
            :disabled="loading"
            @click="handleManageSubscription"
          />
        </div>
      </div>
    </div>

    <!-- PLAN PICKER ---------------------------------------------------------------------- -->
    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        v-for="group in groupedPlans"
        :key="group.product.id"
        class="h-full w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p class="font-semibold">{{ group.product.name }}</p>
        <p class="mt-1 mb-5 text-sm text-neutral-500">
          {{ group.product.description }}
        </p>

        <Tabs :default-value="group.plans.monthly ? 'monthly' : 'yearly'">
          <!-- tab headers -->
          <TabsList class="mb-5 grid w-full grid-cols-2">
            <TabsTrigger
              value="monthly"
              :disabled="!group.plans.monthly"
              class="data-[state=active]:text-orange-500 dark:data-[state=active]:text-orange-500"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              :disabled="!group.plans.yearly"
              class="data-[state=active]:text-orange-500 dark:data-[state=active]:text-orange-500"
            >
              Yearly
            </TabsTrigger>
          </TabsList>

          <!-- monthly card -->
          <TabsContent value="monthly" v-if="group.plans.monthly">
            <AppPricingCard
              :key="group.plans.monthly.id"
              :title="group.product.name"
              :description="group.product.description || ''"
              :unit-amount="group.plans.monthly.unitAmount"
              :interval="group.plans.monthly.interval"
              :price-id="group.plans.monthly.id"
              :features="group.product.features"
              :active="currentPlan.id === group.plans.monthly.id"
              :loading="loadingPriceId === group.plans.monthly.id"
              :disabled="disabled"
              :disable-pending="
                activeSubscription?.pendingPriceId === group.plans.monthly.id
              "
              :has-active-subscription="!!activeSubscription"
              @subscribe="handleSubscribe"
              @manage="handleManageSubscription"
            />
          </TabsContent>

          <!-- yearly card -->
          <TabsContent value="yearly" v-if="group.plans.yearly">
            <AppPricingCard
              :key="group.plans.yearly.id"
              :title="group.product.name"
              :description="group.product.description || ''"
              :unit-amount="group.plans.yearly.unitAmount"
              :interval="group.plans.yearly.interval"
              :price-id="group.plans.yearly.id"
              :features="group.product.features"
              :active="currentPlan.id === group.plans.yearly.id"
              :loading="loadingPriceId === group.plans.yearly.id"
              :disabled="disabled"
              :disable-pending="
                activeSubscription?.pendingPriceId === group.plans.yearly.id
              "
              :has-active-subscription="!!activeSubscription"
              @subscribe="handleSubscribe"
              @manage="handleManageSubscription"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </AppContainer>
</template>

<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppContainer } from '#components'
import { useSubscription } from '@/composables/useSubscription'

const {
  groupedPlans,
  activeSubscription,
  currentPlan,
  subscribe,
  managePortal,
  cancelDowngrade,
  loading,
  formatPrice,
  getStatusColor,
  getSubscriptionMessage,
} = useSubscription()

const loadingPriceId = ref<string | null>(null)
const disabled = computed(() => loading.value)

async function handleSubscribe(priceId: string) {
  loadingPriceId.value = priceId
  try {
    await subscribe(priceId)
  } finally {
    loadingPriceId.value = null
  }
}

const handleManageSubscription = managePortal
const handleCancelDowngrade = cancelDowngrade
</script>
