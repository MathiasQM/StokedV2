<script setup lang="ts">
interface ContextOption {
  value: string
  label: string
  icon: string
}

defineProps<{
  context: string
  options: ContextOption[]
  mode: 'desktop' | 'mobile'
}>()

defineEmits<{
  (e: 'update:context', value: string): void
}>()
</script>

<template>
  <!-- Desktop View -->
  <div
    v-if="mode === 'desktop'"
    class="flex items-center gap-1 px-4 py-2 border-b border-white/5"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      @click="$emit('update:context', opt.value)"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
      :class="
        context === opt.value
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white hover:bg-white/5'
      "
    >
      <Icon :name="opt.icon" class="w-3.5 h-3.5" />
      {{ opt.label }}
    </button>
  </div>

  <!-- Mobile View -->
  <div
    v-else
    class="fixed bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black to-transparent pb-safe z-50"
    @click.stop
  >
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
      <button
        v-for="opt in options"
        :key="opt.value"
        @click="$emit('update:context', opt.value)"
        class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap backdrop-blur-md border border-white/10 shadow-lg"
        :class="
          context === opt.value
            ? 'bg-white text-black'
            : 'bg-black/80 text-white'
        "
      >
        <Icon :name="opt.icon" class="w-4 h-4" />
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
