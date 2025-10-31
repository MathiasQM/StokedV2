<template>
  <div>
    <div v-if="!disableActions" class="flex justify-end mb-4">
      <button
        v-if="isEditing"
        @click="isEditing = false"
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

    <div v-if="pending" class="space-y-4 p-4">
      <div
        v-for="i in 4"
        :key="i"
        class="h-24 w-full bg-zinc-800/50 rounded-lg animate-pulse"
      ></div>
    </div>

    <div
      v-else-if="!editableHoldings || editableHoldings.length === 0"
      class="text-center p-8 text-zinc-500"
    >
      <p>You don't have any holdings in this portfolio yet.</p>
      <button
        v-if="isEditing"
        @click="addHolding"
        class="mt-4 w-full max-w-xs py-2 px-4 text-sm font-semibold text-zinc-200 bg-blue-600 hover:bg-blue-500 rounded-lg"
      >
        + Add Your First Holding
      </button>
    </div>

    <div v-else class="bg-neutral-900 rounded-lg border border-zinc-800">
      <TransitionGroup
        tag="div"
        name="list-item"
        class="divide-y divide-zinc-800"
      >
        <div
          v-for="holding in editableHoldings"
          :key="holding.id"
          class="border-t border-zinc-800"
        >
          <div class="relative">
            <Transition name="slide-up">
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
                    >{{ holding.name?.[0] }}</span
                  >
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
                    >{{ holding.name?.[0] }}</span
                  >
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
                      v-model.number="holding.avgPrice"
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
                      v-model.number="holding.amount"
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

      <div class="p-4" v-if="isEditing">
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
import { ref, watch } from 'vue'

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

const { currentPortfolio } = usePortfolio()
const isEditing = ref(props.isEditing)

const {
  data: holdings,
  pending,
  error,
  refresh: refreshHoldings,
} = await useAsyncData(
  `holdings-${currentPortfolio?.value?.id}`,
  () =>
    $fetch(`/api/portfolios/${currentPortfolio?.value?.id}/positions`, {
      method: 'GET',
    }),
  { watch: [currentPortfolio] },
)

type Holding = {
  id: string
  website: string | null | undefined
  name: string
  value: number
  return: number
  today: number
  latest: number
  symbol: string
  avgPrice: number
  amount: number
  isNew?: boolean
}

const editableHoldings = ref<Holding[]>([])

watch(
  holdings,
  (newHoldings) => {
    if (!isEditing.value && newHoldings) {
      editableHoldings.value = JSON.parse(JSON.stringify(newHoldings))
    }
  },
  { immediate: true, deep: true },
)

function addHolding() {
  editableHoldings.value.push({
    id: `new-${Date.now()}`,
    name: 'New Holding',
    symbol: '',
    avgPrice: 0,
    amount: 0,
    website: '',
    value: 0,
    return: 0,
    today: 0,
    latest: 0,
    isNew: true,
  })
}

function deleteHolding(holdingId: string) {
  editableHoldings.value = editableHoldings.value.filter(
    (h) => h.id !== holdingId,
  )
}

async function handleEditSave() {
  console.log(editableHoldings.value)
  if (isEditing.value) {
    pending.value = true

    const payload = editableHoldings.value.map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      avgPrice: holding.avgPrice,
      amount: holding.amount,
    }))
    try {
      await $fetch(`/api/portfolios/${currentPortfolio.value.id}/positions`, {
        method: 'PATCH',
        body: { holdings: editableHoldings.value },
      })

      await refreshHoldings()
      isEditing.value = false
    } catch (saveError) {
      console.error('Failed to save holdings:', saveError)
    } finally {
      pending.value = false
    }
  } else {
    editableHoldings.value = JSON.parse(JSON.stringify(holdings.value || []))
    isEditing.value = true
  }
}

function getLogoSrc(website: string | null | undefined): string {
  const fallbackLogo = 'https.placehold.co/20x20/404040/9ca3af?text=?' // A generic fallback
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
  }).format(value)
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}
</script>

<style scoped>
/* Defines the starting state for the element that is entering.
  It's invisible and shifted 20px down.
*/
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* Defines the final state for the element that is leaving.
  It's invisible and shifted 20px up ("up and out").
*/
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Defines the duration and easing for the transition.
  This class is active for both entering and leaving elements.
*/
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

/*
  This is a key part! When an element is leaving, we make it
  absolute so it doesn't push the new entering element around.
  This allows both to animate smoothly in the same space.
*/
.slide-up-leave-active {
  position: absolute;
  width: 100%; /* Ensure it takes up the full width */
}

/* NEW: Styles for the list-item animation */
.list-item-enter-from,
.list-item-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.list-item-enter-active,
.list-item-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

/* This ensures the leaving item is taken out of the layout flow
   so the move animation can be calculated correctly. */
.list-item-leave-active {
  position: absolute;
  width: 100%; /* prevent collapsing */
}

/* This class is applied to remaining items when an item is removed,
   creating a smooth shuffling effect. */
.list-item-move {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
