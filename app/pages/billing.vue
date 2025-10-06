<template>
  <AppContainer
    title="Billing"
    description="Manage your billing information and subscription plans."
  >
    <div
      class="flex h-full flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="flex flex-col space-y-4">
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
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
                    @click="cancelDowngrade(activeSubscription.id)"
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
          <UButton
            v-if="activeSubscription"
            color="neutral"
            variant="outline"
            label="Manage Subscription"
            :loading="loading"
            :disabled="loading"
            @click="managePortal"
          />
        </div>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <AppPricingCard
        v-for="plan in plans.sort((a, b) =>
          a.product.name.localeCompare(b.product.name),
        )"
        :key="plan.id"
        :title="plan.product.name"
        :description="plan.product.description || ''"
        :unit-amount="plan.unitAmount"
        :interval="plan.interval"
        :price-id="plan.id"
        :features="plan.product.features"
        :active="currentPlan.id === plan.id"
        :loading="loading"
        :disabled="loading || currentPlan.id === plan.id"
        :has-active-subscription="!!activeSubscription"
        @subscribe="subscribe(plan.id)"
      />
    </div>
  </AppContainer>
</template>

<script lang="ts" setup>
import { useSubscription } from '@/composables/useSubscription'

const {
  plans,
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

const route = useRoute()
const { fetch: refreshSession } = useUserSession()

onMounted(async () => {
  if (route.query.success === 'true') {
    await refreshSession()
  }
})
</script>
