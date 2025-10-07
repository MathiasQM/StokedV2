<template>
  <div class="w-full overflow-y-scroll">
    <header class="flex h-12 w-full items-center gap-2 px-4">
      <UButton
        icon="i-lucide-panel-left"
        color="orange"
        variant="ghost"
        class="flex lg:hidden"
        @click="emit('openSidebar')"
      />
      <slot name="actions" />
    </header>
    <slot />
  </div>
</template>

<script setup>
const emit = defineEmits(['openSidebar'])
</script>
