<script setup lang="ts">
import { resolve } from '@/components/podcasts/registry'

const props = defineProps<{
  article: {
    sections: { id: string; html?: string; text?: string }[]
    // Ensure the prop definition includes article_components
    article_components?: {
      where: { sectionId: string }
      component: { type: string; params: any }
    }[]
  }
}>()

function compsFor(sectionId: string) {
  // This function should correctly find components by matching the sectionId
  return (props.article.article_components || [])
    .filter((c) => c.where?.sectionId === sectionId)
    .map((c) => c.component)
}
</script>

<template>
  <div class="space-y-8">
    <section v-for="s in article.sections" :key="s.id" class="space-y-4">
      <div
        v-if="s.html"
        v-html="s.html"
        class="prose prose-invert max-w-none"
      ></div>
      <p v-else class="opacity-90">{{ s.text }}</p>

      <div class="grid gap-4 md:grid-cols-2">
        <component
          v-for="(c, i) in compsFor(s.id)"
          :key="s.id + '-' + i"
          :is="resolve(c.type)"
          v-bind="c.params"
          class="animate-in fade-in duration-300"
        />
      </div>
    </section>
  </div>
</template>
