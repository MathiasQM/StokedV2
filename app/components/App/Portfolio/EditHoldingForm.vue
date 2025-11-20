<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img
          v-if="holding.website"
          :src="getLogoSrc(holding.website)"
          class="w-8 h-8 bg-zinc-700 rounded-full"
          :alt="`${holding.name} logo`"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span
          v-else
          class="bg-neutral-800 h-8 w-8 aspect-square rounded-full flex items-center text-sm justify-center"
        >
          {{ holding.name?.[0] }}
        </span>
        <div>
          <h3 class="text-lg font-semibold text-white">{{ holding.name }}</h3>
          <p class="text-sm text-zinc-400">{{ holding.symbol }}</p>
        </div>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        @click="onCancel"
      />
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-zinc-400 mb-1"
          >Average Cost Per Share</label
        >
        <UInput
          v-model="editedHolding.avgCostPerShare"
          type="number"
          step="0.01"
          placeholder="0.00"
          icon="i-lucide-dollar-sign"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-zinc-400 mb-1"
          >Shares Owned</label
        >
        <UInput
          v-model="editedHolding.shares"
          type="number"
          step="1"
          placeholder="0"
          icon="i-lucide-hash"
        />
      </div>
    </div>

    <div class="flex justify-between pt-4 border-t border-zinc-800">
      <UButton
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        label="Remove Holding"
        @click="confirmDelete"
      />
      <div class="flex gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="onCancel"
        />
        <UButton
          color="primary"
          label="Save Changes"
          :loading="saving"
          @click="save"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  holding: any
  onSave: (holding: any) => void
  onDelete: (id: string) => void
  onCancel: () => void
  saving?: boolean
}>()

const editedHolding = ref({ ...props.holding })

watch(
  () => props.holding,
  (newVal) => {
    editedHolding.value = { ...newVal }
  },
)

function save() {
  props.onSave(editedHolding.value)
}

function confirmDelete() {
  if (confirm('Are you sure you want to remove this holding?')) {
    props.onDelete(props.holding.id)
  }
}

function getLogoSrc(website: string | null | undefined): string {
  const fallbackLogo = 'https.placehold.co/20x20/404040/9ca3af?text=?'
  if (!website) {
    return fallbackLogo
  }
  return `https://logo.clearbit.com/${encodeURIComponent(website)}`
}
</script>
