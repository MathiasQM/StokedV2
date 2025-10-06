<template>
  <div
    class="relative min-h-[100dvh] pb-28 pt-5 lg:pt-5"
    :class="{ 'px-5': !disablePaddingx }"
  >
    <div
      v-if="hasActions"
      class="mb-5 flex h-14 w-full rounded-md border border-black-200 bg-black-100 p-3 dark:border-black-600 dark:bg-black-800"
    >
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disablePaddingx?: boolean
  }>(),
  {
    disablePaddingx: false,
  },
)
const slots = useSlots()
const hasActions = computed(() => !!slots.actions)
</script>
