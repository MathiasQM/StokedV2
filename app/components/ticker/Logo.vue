<template>
  <span
    v-if="!logoUrl"
    class="h-6 w-6 uppercase rounded-full bg-black-600 flex items-center justify-center font-black"
    >{{ symbol[0] }}</span
  >

  <img
    v-else
    :key="logoUrl"
    :src="`https://eodhd.com${logoUrl}`"
    :alt="`${symbol} logo`"
    class="block h-6 w-6 rounded-full bg-black-600 p-1"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  logoUrl?: string
  symbol: string
}>()
</script>

<style scoped>
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
