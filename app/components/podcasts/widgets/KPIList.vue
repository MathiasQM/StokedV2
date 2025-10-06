<script setup lang="ts">
const props = defineProps<{
  items: { label: string; value: string; trend?: 'up' | 'down' }[]
}>()
</script>

<template>
  <div class="rounded-2xl bg-zinc-800/60 p-4">
    <h3 class="mb-3 text-xs tracking-wide uppercase opacity-70">Key metrics</h3>
    <!-- <ul class="grid gap-2">
      <li v-for="(k, i) in props.items" :key="i" class="flex justify-between">
        <span class="opacity-80">{{ k.label }}</span>
        <span class="font-semibold">{{ k.value }}</span>
      </li>
    </ul> -->
  </div>
</template>
