<template>
  <div class="flex flex-col h-full min-h-screen bg-black text-white">
    <!-- Header -->
    <header
      class="flex items-center justify-between px-4 py-3 border-b border-white/10"
    >
      <button
        @click="router.back()"
        class="p-2 -ml-2 text-white/60 hover:text-white rounded-full hover:bg-white/10"
      >
        <Icon name="i-lucide-chevron-left" class="w-6 h-6" />
      </button>

      <AppPortfolioDropdown key="portfolio" />

      <div class="w-10"></div>
      <!-- Spacer for centering if needed, or actions -->
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-4 pb-24">
      <slot />
    </main>

    <!-- Chat Input Footer -->
    <footer
      class="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-white/10 pb-safe"
    >
      <div class="relative max-w-3xl mx-auto">
        <input
          type="text"
          placeholder="Ask AI anything..."
          class="w-full bg-white/10 rounded-full pl-4 pr-12 py-3 text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-white/20"
        />
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <Icon name="i-lucide-arrow-up" class="w-4 h-4" />
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
