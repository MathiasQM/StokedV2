<script setup lang="ts">
import type { TickerMeta } from '@@/types/eodhd'

defineProps<{
  history: TickerMeta[]
}>()

defineEmits<{
  (e: 'click', item: TickerMeta): void
  (e: 'remove', item: TickerMeta): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between px-2 mb-2">
      <h3 class="text-xs font-semibold text-white/40 uppercase">
        Recent Searches
      </h3>
      <button
        @click="$emit('clear')"
        class="text-xs text-white/40 hover:text-white"
      >
        Clear
      </button>
    </div>
    <div class="flex flex-col gap-1">
      <div
        v-for="item in history"
        :key="item.Code"
        class="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer group"
        @click="$emit('click', item)"
      >
        <div class="flex items-center gap-3">
          <Icon name="i-lucide-clock" class="w-4 h-4 text-white/40" />
          <div class="text-white font-medium">{{ item.Code }}</div>
          <div class="text-white/60 text-xs">{{ item.Name }}</div>
        </div>
        <button
          @click.stop="$emit('remove', item)"
          class="text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
