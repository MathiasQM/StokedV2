<script setup lang="ts">
const props = defineProps<{ src: string; caption?: string }>()
</script>

<template>
  <figure class="overflow-hidden rounded-2xl bg-zinc-800/60">
    <h1>This is an image</h1>
    <img :src="props.src" alt="" class="h-48 w-full object-cover" />
    <figcaption v-if="props.caption" class="px-4 py-2 text-sm opacity-80">
      {{ props.caption }}
    </figcaption>
  </figure>
</template>
