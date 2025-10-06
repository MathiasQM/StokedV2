<template>
  <div
    v-if="showUserSettings"
    @click="showUserSettings = false"
    class="bg-black-950 fixed top-0 left-0 z-50 h-screen w-full p-5"
  >
    <Button variant="outline" size="icon" class="mb-5">
      <Icon name="i-lucide-chevron-left" />
    </Button>
    <slot name="options" />
  </div>
</template>

<script setup lang="ts">
const showUserSettings = defineModel<boolean>()
</script>
