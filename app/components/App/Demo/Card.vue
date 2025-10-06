<template>
  <div class="dark:bg-neutral-950 rounded-xl bg-[#fbfaf9] p-1.5">
    <div class="card-shadow bg-white dark:bg-neutral-900 rounded-md">
      <header
        class="border-neutral-100 dark:border-white/10 border-b px-4 py-2"
      >
        <p class="text-neutral-500 text-sm">{{ title }}</p>
      </header>
      <div class="p-4">
        <slot />
        <p v-if="description" class="text-neutral-500 text-sm">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped>
.card-shadow {
  box-shadow:
    0 1px 2px #5f4a2e14,
    0 4px 6px #5f4a2e0a,
    0 24px 40px -16px #684b2514;
}
</style>
