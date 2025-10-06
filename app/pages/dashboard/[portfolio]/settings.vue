<template>
  <div class="pt-1">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['portfolio-owner'],
})
</script>
