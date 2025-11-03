<template>
  <div>
    <div v-if="!disableActions" class="flex justify-end gap-3 mb-4">
      <button
        v-if="isEditing"
        @click="cancelEditing"
        class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
      >
        Cancel
      </button>
      <button
        @click="handleEditSave"
        class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
        :class="
          isEditing
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
        "
      >
        {{ isEditing ? 'Save Changes' : 'Edit Holdings' }}
      </button>
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
              <!-- VIEW MODE -->
              <div
                v-if="!isEditing"
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

                  <div class="text-right text-xs">
                    <p class="text-xs text-zinc-500">Latest</p>
                    <p class="text-xs text-zinc-400">
                      {{ formatCurrency(holding.latest, 'USD') }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- EDIT MODE -->
              <div
                v-else
                :key="'edit-' + holding.id"
                class="flex flex-col items-between justify-end gap-4 p-4"
              >
                <div class="flex items-center gap-2 w-full">
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
                  <p class="font-semibold text-white text-sm truncate min-w-0">
                    {{ holding.name }}
                  </p>
                </div>

                <div class="flex w-full items-end gap-4">
                  <div class="text-start text-xs">
                    <label class="text-xs text-zinc-500 block mb-1"
                      >Price</label
                    >
                    <input
                      v-model.number="holding.avgCostPerShare"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      class="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    />
                  </div>

                  <div class="text-start text-xs">
                    <label class="text-xs text-zinc-500 block mb-1"
                      >Amount</label
                    >
                    <input
                      v-model.number="holding.shares"
                      type="number"
                      step="1"
                      placeholder="0"
                      class="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    />
                  </div>

                  <button
                    @click="deleteHolding(holding.id)"
                    class="w-9 h-9 bg-red-500 font-semibold p-2 rounded-md mt-5"
                  >
                    <Icon name="i-lucide-trash-2" />
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </TransitionGroup>

      <div class="p-4" v-if="isEditing && !disableActions">
        <button
          @click="addHolding"
          class="w-full py-2 px-4 text-sm font-semibold text-zinc-200 bg-black-800 hover:bg-white-100 hover:text-black rounded-lg"
        >
          + Add New Holding
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePortfoliosStore } from '~~/stores/portfolios'
import type { PortfolioPosition } from '~~/types/database'

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

const portfoliosStore = usePortfoliosStore()
const { positionsWithCalculations, pending, error } =
  storeToRefs(portfoliosStore)

const { currentPortfolio } = usePortfolio()
console.log('route.params.isEditing', route)
const isEditing = ref(route.query.isEditing || props.isEditing)

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

const editableHoldings = ref<Array<ReturnType<typeof makeEditableHolding>>>([])

function makeEditableHolding(base?: any) {
  return {
    id: base?.id ?? `new-${Date.now()}`,
    symbol: base?.symbol ?? '',
    name: base?.name ?? 'New Holding',
    exchange: base?.exchange ?? '',
    website: base?.website ?? '',

    value: base?.value ?? 0,
    return: base?.return ?? 0,
    today: base?.today ?? 0,
    latest: base?.latest ?? 0,

    avgCostPerShare: base?.avgCostPerShare ?? 0,
    shares: base?.shares ?? 0,

    isNew: base?.isNew ?? !base,
  }
}

watch(
  [liveHoldingsView, isEditing],
  ([newHoldings, editing]) => {
    if (!editing && newHoldings) {
      editableHoldings.value = newHoldings.map((h) => makeEditableHolding(h))
    }
  },
  { immediate: true, deep: true },
)

function cancelEditing() {
  editableHoldings.value = liveHoldingsView.value.map((h) =>
    makeEditableHolding(h),
  )
  isEditing.value = false
}

function addHolding() {
  editableHoldings.value.push(
    makeEditableHolding({
      isNew: true,
    }),
  )
}

function deleteHolding(holdingId: string) {
  editableHoldings.value = editableHoldings.value.filter(
    (h) => h.id !== holdingId,
  )
}

async function handleEditSave() {
  if (!isEditing.value) {
    editableHoldings.value = liveHoldingsView.value.map((h) =>
      makeEditableHolding(h),
    )
    isEditing.value = true
    return
  }

  try {
    pending.value = true

    const payload = editableHoldings.value.map((h) => ({
      name: h.name,
      symbol: h.symbol,
      website: h.website || null,
      shares: parseInt(h.shares) || null,
      costPerShare: parseInt(h.avgCostPerShare),
    }))

    await $fetch(`/api/portfolios/${currentPortfolio.value.id}/positions`, {
      method: 'PATCH',
      body: payload,
    })

    await portfoliosStore.fetchPositions()

    toast.add({
      title: 'Holdings updated successfully.',
      color: 'success',
    })
    isEditing.value = false
  } catch (saveError) {
    console.error('Failed to save holdings:', saveError)
    toast.add({
      title: 'Failed to update holdings.',
      color: 'error',
    })
  } finally {
    pending.value = false
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
