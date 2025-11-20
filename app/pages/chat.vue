<script setup lang="ts">
definePageMeta({
  title: 'AI Chat',
  middleware: 'auth',
  layout: 'chat',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full text-center">
    <div
      class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4"
    >
      <Icon name="i-lucide-sparkles" class="w-8 h-8 text-white" />
    </div>
    <h1 class="text-2xl font-bold text-white mb-2">AI Assistant</h1>
    <p class="text-white/60 max-w-md">
      Chat with your portfolio and the market. Coming soon.
    </p>
  </div>
</template>
