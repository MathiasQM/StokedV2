<!-- components/podcast/Stage.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { resolve } from '@/components/podcasts/registry' // keep your custom path

type CuePayload = { at: number; components: { type: string; params: any }[] }
const active = ref<{ id: string; type: string; params: any }[]>([])

const onCue = (e: Event) => {
  const { components, at } = (e as CustomEvent<CuePayload>).detail
  console.log('[Stage] received cue @', at, components)
  components.forEach((c: any, k: number) => {
    active.value.push({
      id: `${c.type}-${at}-${k}`,
      type: c.type,
      params: c.params,
    })
  })
}

onMounted(() => {
  console.log('[Stage] mounted; wiring listener')
  window.addEventListener('podcast-cue', onCue as any)
})
onBeforeUnmount(() => window.removeEventListener('podcast-cue', onCue as any))
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <component
      v-for="w in active"
      :key="w.id"
      :is="resolve(w.type)"
      v-bind="w.params"
      class="rounded-2xl p-4 shadow"
    />
  </div>
</template>
