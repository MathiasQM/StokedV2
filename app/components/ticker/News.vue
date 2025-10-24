<script setup lang="ts">
import { ref, computed, defineAsyncComponent, type Component } from 'vue'
import { useRoute } from 'vue-router'
// Assuming animate.css is included globally or via import
// import 'animate.css';

// --- Type Definitions ---
interface Animation {
  animateIn: string
  animateOut: string // Note: Implementing animateOut is more complex
}

interface ArticleComponentData {
  componentName: string
  paragraphIndex: number
  placement: 'above' | 'below' | 'inline-left' | 'inline-right'
  animation: Animation
}

interface ArticleData {
  id: string
  created_at: string
  ticker: string
  title: string
  introduction: string
  body: string[] // Expecting an array of strings after parsing
  conclusion: string
  components: ArticleComponentData[] // Expecting an array of objects after parsing
}

// --- Component Imports (Dynamic) ---
// Use defineAsyncComponent for better performance and code splitting
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
  // Add other components referenced by the AI here
}

// --- Route and Data Fetching ---
const { symbol } = defineProps<{
  symbol: string
}>()

// useAsyncData provides server-side rendering and efficient caching
// The key ensures data is refetched only when the ticker changes
const {
  data: article,
  pending,
  error,
} = await useAsyncData<ArticleData | null>(
  `article-${symbol}`, // Unique key for caching based on ticker
  async () => {
    try {
      // Replace with your actual API endpoint to fetch the *latest* article
      const response = await $fetch(`/api/article/get-latest?ticker=${symbol}`)

      // Basic validation and parsing (adjust based on your actual API response)
      if (
        response &&
        typeof response === 'object' &&
        response.body &&
        response.components
      ) {
        try {
          response.components = JSON.parse(response.components as string)
        } catch (e) {
          console.error('Failed to parse article components:', e)
          response.components = [] // Provide fallback
        }
        return response as ArticleData
      }
      return null // No article found or invalid data
    } catch (fetchError) {
      console.error('Error fetching article:', fetchError)
      return null
    }
  },
  {
    // Optional: Add watch if you need reactivity beyond route changes
    watch: [symbol],
  },
)

// --- Computed Properties for Rendering ---
const getComponentsForIndex = (index: number) => {
  return (
    article.value?.components.filter((c) => c.paragraphIndex === index) || []
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

<template>
  <ElementsCard>
    <div
      class="article-container p-4 md:p-6 lg:p-8 max-w-4xl mx-auto font-sans"
    >
      <!-- Loading State -->
      <div v-if="pending" class="text-center py-10">
        <p class="text-lg text-gray-500">Loading article...</p>
        <!-- Add a spinner or skeleton loader here -->
      </div>

      <!-- Error State -->
      <div
        v-else-if="error || !article"
        class="text-center py-10 bg-red-100 border border-red-400 text-red-700 px-4 rounded relative"
      >
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">
          Could not load the article for {{ symbol }}. Please try again
          later.</span
        >
        <pre v-if="error" class="text-xs text-left mt-2">{{
          error.message
        }}</pre>
      </div>

      <!-- Article Content -->
      <article v-else class="prose lg:prose-xl max-w-none">
        <!-- Title -->
        <h1 class="text-xl lg:text-3xl font-bold mb-4 text-white">
          {{ article.title }}
        </h1>
        <p class="text-sm text-neutral-400 mb-6">
          Published on: {{ article.createdAt }}
        </p>

        <!-- Introduction -->
        <p class="text-lg mb-6 text-neutral-100">{{ article.introduction }}</p>

        <!-- Body Paragraphs and Components -->
        <div
          v-for="(paragraph, index) in article.body"
          :key="`para-${index}`"
          class="paragraph-block mb-6"
        >
          <!-- Components Above -->
          <div
            v-for="component in getNonInlineComponents(index).filter(
              (c) => c.placement === 'above',
            )"
            :key="`comp-above-${index}-${component.componentName}`"
            class="component-wrapper my-4"
          >
            <component
              :is="resolveComponent(component.componentName)"
              v-if="resolveComponent(component.componentName)"
              :ticker="symbol"
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

          <!-- Paragraph with Inline Components -->
          <div
            v-if="hasInlineComponent(index)"
            class="inline-wrapper flex flex-col md:flex-row gap-4 items-start"
          >
            <!-- Inline Left Component -->
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
                :ticker="symbol"
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

            <!-- Paragraph Text -->
            <p class="flex-grow text-neutral-100">{{ paragraph }}</p>

            <!-- Inline Right Component -->
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
                :ticker="symbol"
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

          <!-- Standard Paragraph (No Inline) -->
          <p v-else class="text-neutral-100">{{ paragraph }}</p>

          <!-- Components Below -->
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
              :ticker="symbol"
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

        <!-- Conclusion -->
        <p class="text-lg mt-8 border-t pt-6 text-neutral-100">
          {{ article.conclusion }}
        </p>
      </article>
    </div>
  </ElementsCard>
</template>

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
