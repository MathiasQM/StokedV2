<template>
  <div>
    <div v-if="!disableActions" class="flex justify-end gap-3 mb-4">
      <!-- Actions will be moved to per-row -->
    </div>

    <!-- Loading skeleton -->
    <div v-if="pending" class="space-y-4 p-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-24 w-full bg-zinc-800/50 rounded-lg animate-pulse"
      />
    </div>

    <!-- Holdings list -->
    <div v-else class="bg-neutral-900 rounded-lg">
      <TransitionGroup
        tag="div"
        name="list-item"
        class="divide-y divide-zinc-800"
      >
        <div v-for="holding in editableHoldings" :key="holding.id">
          <div class="relative">
            <Transition name="slide-up">
              <div
                :key="'view-' + holding.id"
                class="flex flex-col items-center p-4"
              >
                <div class="flex gap-2 w-full mb-1">
                  <img
                    v-if="holding.website"
                    :src="getLogoSrc(holding.website)"
                    class="w-5 h-5 bg-zinc-700 rounded-full"
                    :alt="`${holding.name} logo`"
                    @error="
                      ($event.target as HTMLImageElement).style.display = 'none'
                    "
                  />
                  <span
                    v-else
                    class="bg-neutral-800 h-5 w-5 aspect-square rounded-full flex items-center text-xs justify-center"
                  >
                    {{ holding.name?.[0] }}
                  </span>
                  <p class="font-semibold text-white text-sm">
                    {{ holding.name }}
                  </p>
                </div>

                <div class="flex w-full justify-between">
                  <div class="text-start text-xs">
                    <p class="text-xs text-zinc-500">Value</p>
                    <p
                      class="font-semibold"
                      :class="
                        holding.return >= 0 ? 'text-green-400' : 'text-red-400'
                      "
                    >
                      {{ formatCurrency(holding.value, 'DKK') }}
                    </p>
                  </div>

                  <div class="text-start text-xs">
                    <p class="text-xs text-zinc-500">Return</p>
                    <p
                      class="font-semibold"
                      :class="
                        holding.return >= 0 ? 'text-green-400' : 'text-red-400'
                      "
                    >
                      {{ formatPercent(holding.return) }}
                    </p>
                  </div>

                  <div class="text-start text-xs">
                    <p class="text-xs text-zinc-500">Today</p>
                    <p
                      class="font-semibold"
                      :class="
                        holding.today >= 0 ? 'text-green-400' : 'text-red-400'
                      "
                    >
                      {{ formatPercent(holding.today) }}
                    </p>
                  </div>

                  <div class="text-right text-xs flex items-center gap-2">
                    <div>
                      <p class="text-xs text-zinc-500">Latest</p>
                      <p class="text-xs text-zinc-400">
                        {{ formatCurrency(holding.latest, 'USD') }}
                      </p>
                    </div>
                    <UButton
                      v-if="!disableActions"
                      icon="i-lucide-pencil"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      @click="openEditModal(holding)"
                    />
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { usePortfolioRealtime } from '@/composables/portfolio/usePortfolioRealtime'
import { usePortfoliosStore } from '@@/stores/portfolios'
import { useGlobalDrawerDialogStore } from '~~/stores/globalDrawerDialog'
import EditHoldingForm from './EditHoldingForm.vue'

const props = withDefaults(
  defineProps<{
    isEditing?: boolean
    disableActions?: boolean
  }>(),
  {
    isEditing: false,
    disableActions: false,
  },
)
const route = useRoute()
const toast = useToast()

const { positionsWithCalculations, pending, error } = usePortfolioRealtime()
const portfoliosStore = usePortfoliosStore()

const { currentPortfolio } = usePortfolio()
const store = useGlobalDrawerDialogStore()

const isSaving = ref(false)

const liveHoldingsView = computed(() =>
  (positionsWithCalculations.value || []).map((p) => ({
    id: p.id,
    symbol: p.symbol,
    name: p.name,
    website: p.website,
    value: p.marketValue,
    return: p.gainLossPercent ?? 0,
    today: p.todayChangePct ?? 0,
    latest: p.livePrice,
    avgCostPerShare: p.costPerShare,
    shares: p.shares,
  })),
)

// Simplified view, no editable copy needed for list display
const editableHoldings = computed(() => liveHoldingsView.value)

function openEditModal(holding: any) {
  store.openModal({
    title: 'Edit Holding',
    component: EditHoldingForm,
    componentProps: {
      holding,
      saving: isSaving,
      onSave: handleModalSave,
      onDelete: handleModalDelete,
      onCancel: store.closeModal,
    },
  })
}

async function handleModalSave(updatedHolding: any) {
  try {
    isSaving.value = true

    // Create a new list with the updated holding
    // We need to map ALL current holdings to the payload format, replacing the one that was edited
    const payload = liveHoldingsView.value.map((h) => {
      const target = h.id === updatedHolding.id ? updatedHolding : h
      return {
        name: target.name,
        symbol: target.symbol,
        website: target.website || null,
        shares: parseInt(target.shares) || null,
        costPerShare: Number(target.avgCostPerShare), // Use Number for cost
      }
    })

    await $fetch(`/api/portfolios/${currentPortfolio.value.id}/positions`, {
      method: 'PATCH',
      body: payload,
    })

    await portfoliosStore.fetchPositions()

    toast.add({
      title: 'Holding updated successfully.',
      color: 'success',
    })

    store.closeModal()
  } catch (saveError) {
    console.error('Failed to save holding:', saveError)
    toast.add({
      title: 'Failed to update holding.',
      color: 'error',
    })
  } finally {
    isSaving.value = false
  }
}

async function handleModalDelete(holdingId: string) {
  try {
    isSaving.value = true

    // Filter out the deleted holding
    const payload = liveHoldingsView.value
      .filter((h) => h.id !== holdingId)
      .map((h) => ({
        name: h.name,
        symbol: h.symbol,
        website: h.website || null,
        shares: parseInt(h.shares) || null,
        costPerShare: Number(h.avgCostPerShare),
      }))

    await $fetch(`/api/portfolios/${currentPortfolio.value.id}/positions`, {
      method: 'PATCH',
      body: payload,
    })

    await portfoliosStore.fetchPositions()

    toast.add({
      title: 'Holding removed successfully.',
      color: 'success',
    })

    store.closeModal()
  } catch (saveError) {
    console.error('Failed to delete holding:', saveError)
    toast.add({
      title: 'Failed to remove holding.',
      color: 'error',
    })
  } finally {
    isSaving.value = false
  }
}

function getLogoSrc(website: string | null | undefined): string {
  const fallbackLogo = 'https.placehold.co/20x20/404040/9ca3af?text=?'
  if (!website) {
    return fallbackLogo
  }
  return `https://logo.clearbit.com/${encodeURIComponent(website)}`
}

function formatCurrency(value: number, currency: 'DKK' | 'USD') {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value || 0).toFixed(2)}%`
}
</script>

<style scoped>
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-leave-active {
  position: absolute;
  width: 100%;
}
.list-item-enter-from,
.list-item-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.list-item-enter-active,
.list-item-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.list-item-leave-active {
  position: absolute;
  width: 100%;
}
.list-item-move {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
