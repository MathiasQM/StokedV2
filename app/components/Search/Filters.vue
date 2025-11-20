<script setup lang="ts">
defineProps<{
  filters: string[]
  activeFilter: string
  mode?: 'desktop' | 'mobile'
}>()

defineEmits<{
  (e: 'update:activeFilter', value: string): void
}>()
</script>

<template>
  <div
    class="flex items-center gap-2"
    :class="[
      mode === 'mobile'
        ? 'px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/10 bg-black'
        : 'px-4 py-2',
    ]"
  >
    <button
      v-for="filter in filters"
      :key="filter"
      @click="$emit('update:activeFilter', filter)"
      class="font-medium rounded-full transition-colors whitespace-nowrap"
      :class="[
        mode === 'mobile' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs',
        activeFilter === filter
          ? 'bg-white text-black'
          : mode === 'mobile'
            ? 'bg-white/10 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/10',
      ]"
    >
      {{ filter }}
    </button>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
