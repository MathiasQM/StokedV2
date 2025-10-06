<script setup lang="ts">
const props = defineProps<{ ticker: string }>()
</script>

<template>
  <div class="flex items-center gap-3 rounded-2xl bg-zinc-800/60 px-4 py-3">
    <div
      class="grid h-8 w-8 place-items-center rounded bg-zinc-700 text-xs font-bold"
    >
      <h1>This is a logo</h1>

      {{ props.ticker?.slice(0, 4) }}
    </div>
    <div class="font-semibold">{{ props.ticker }}</div>
  </div>
</template>
