<template>
  <div class="flex flex-col gap-5 relative w-full h-full">
    <CustomCard
      enableDots
      enableBorderFlare
      :bg-gradient="{ to: 'black-900', from: 'black-800/40' }"
      class="rounded-b-none! p-3 h-44"
    >
      <div>
        <p class="text-md text-neutral-300 font-semibold uppercase">
          {{ article?.ticker }}
        </p>
      </div>
    </CustomCard>
    <div
      class="article-container h-full relative p-4 md:p-6 lg:p-8 max-w-4xl mx-auto font-sans overflow-scroll"
    >
      <article class="prose lg:prose-xl max-w-none">
        <h1 class="text-xl lg:text-3xl font-bold mb-4 text-white">
          {{ article.title }}
        </h1>
        <p class="text-sm text-neutral-400 mb-6">
          {{ $dayjs(article?.created_at).format('MMMM D, YYYY') }}
        </p>

        <p class="text-sm mb-6 text-neutral-100">
          {{ article.introduction }}
        </p>

        <div
          v-for="(paragraph, index) in article?.body"
          :key="`para-${index}`"
          class="paragraph-block mb-6"
        >
          <div
            v-for="component in getNonInlineComponents(index).filter(
              (c) => c?.placement === 'above',
            )"
            :key="`comp-above-${index}-${component?.componentName}`"
            class="component-wrapper my-4"
          >
            <component
              :is="resolveComponent(component?.componentName)"
              v-if="resolveComponent(component?.componentName)"
              :ticker="article?.ticker"
              class="animate__animated"
              :class="[component?.animation?.animateIn]"
            />
            <div
              v-else
              class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded"
            >
              Warning: Component "{{ component?.componentName }}" not found.
            </div>
          </div>

          <div
            v-if="hasInlineComponent(index)"
            class="inline-wrapper flex flex-col md:flex-row gap-4 items-start"
          >
            <div
              v-if="getInlineComponent(index, 'inline-left')"
              class="component-wrapper md:w-1/3 flex-shrink-0"
            >
              <component
                :is="
                  resolveComponent(
                    getInlineComponent(index, 'inline-left')!.componentName,
                  )
                "
                v-if="
                  resolveComponent(
                    getInlineComponent(index, 'inline-left')!.componentName,
                  )
                "
                :ticker="article?.ticker"
                class="animate__animated"
                :class="[
                  getInlineComponent(index, 'inline-left')!.animation.animateIn,
                ]"
              />
              <div
                v-else
                class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded"
              >
                Warning: Component "{{
                  getInlineComponent(index, 'inline-left')!.componentName
                }}" not found.
              </div>
            </div>

            <p class="flex-grow text-neutral-100">{{ paragraph }}</p>

            <div
              v-if="getInlineComponent(index, 'inline-right')"
              class="component-wrapper md:w-1/3 flex-shrink-0"
            >
              <component
                :is="
                  resolveComponent(
                    getInlineComponent(index, 'inline-right')!.componentName,
                  )
                "
                v-if="
                  resolveComponent(
                    getInlineComponent(index, 'inline-right')!.componentName,
                  )
                "
                :ticker="article?.ticker"
                class="animate__animated"
                :class="[
                  getInlineComponent(index, 'inline-right')!.animation
                    .animateIn,
                ]"
              />
              <div
                v-else
                class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded"
              >
                Warning: Component "{{
                  getInlineComponent(index, 'inline-right')!.componentName
                }}" not found.
              </div>
            </div>
          </div>

          <p v-else class="text-neutral-100">{{ paragraph }}</p>

          <div
            v-for="component in getNonInlineComponents(index).filter(
              (c) => c.placement === 'below',
            )"
            :key="`comp-below-${index}-${component.componentName}`"
            class="component-wrapper my-4"
          >
            <component
              :is="resolveComponent(component.componentName)"
              v-if="resolveComponent(component.componentName)"
              :ticker="article?.ticker"
              class="animate__animated"
              :class="[component.animation.animateIn]"
            />
            <div
              v-else
              class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded"
            >
              Warning: Component "{{ component.componentName }}" not found.
            </div>
          </div>
        </div>

        <p class="text-lg mt-8 border-t pt-6 text-neutral-100">
          {{ article?.conclusion }}
        </p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ article: ArticleData }>()
const { $dayjs } = useNuxtApp()

const componentRegistry: Record<string, Component> = {
  PriceHistoryChart: defineAsyncComponent(
    () => import('@/components/widgets/PriceHistoryChart.vue'),
  ),
  SentimentGauge: defineAsyncComponent(
    () => import('@/components/widgets/SentimentGauge.vue'),
  ),
  KeyFundamentalsTable: defineAsyncComponent(
    () => import('@/components/widgets/KeyFundamentalsTable.vue'),
  ),
  NewsTimeline: defineAsyncComponent(
    () => import('@/components/widgets/NewsTimeline.vue'),
  ),
}

// --- Computed Properties for Rendering ---
const getComponentsForIndex = (index: number) => {
  return (
    props.article?.components.filter((c) => c.paragraphIndex === index) || []
  )
}

const hasInlineComponent = (index: number) => {
  return getComponentsForIndex(index).some(
    (c) => c.placement === 'inline-left' || c.placement === 'inline-right',
  )
}

const getInlineComponent = (
  index: number,
  placement: 'inline-left' | 'inline-right',
) => {
  return getComponentsForIndex(index).find((c) => c.placement === placement)
}

const getNonInlineComponents = (index: number) => {
  return getComponentsForIndex(index).filter(
    (c) => c.placement !== 'inline-left' && c.placement !== 'inline-right',
  )
}

// Function to safely get the component implementation
const resolveComponent = (componentName: string): Component | null => {
  return componentRegistry[componentName] || null // Return null if component not found
}
</script>

<style scoped>
/* Add any specific styles for layout or animations here */
.article-container {
  font-family: 'Inter', sans-serif; /* Example font */
}

/* Basic styling for prose using Tailwind's plugin is assumed */
/* Add custom styles if not using prose */
h1 {
  line-height: 1.2;
}

p {
  line-height: 1.7;
}

.component-wrapper {
  /* Add borders, background, or spacing if desired */
  border-radius: 8px;
}

/* Ensure inline components don't stretch paragraphs too much on small screens */
@media (max-width: 767px) {
  .inline-wrapper {
    flex-direction: column;
  }
  .inline-wrapper .component-wrapper {
    width: 100%;
    margin-bottom: 1rem; /* Space between component and paragraph */
  }
}
</style>
