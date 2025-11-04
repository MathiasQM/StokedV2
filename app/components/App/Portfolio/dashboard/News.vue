<template>
  <div class="w-full h-screen flex flex-col items-center gap-3">
    <p v-if="pending">Loading articles...</p>
    <p v-else-if="!articles || articles.length === 0">No articles found.</p>

    <CustomCard
      enableBorderFlare
      v-else
      v-for="(article, index) in articles"
      :key="index"
      class="p-2 w-full flex"
      @click="openArticle(article)"
    >
      <div class="h-32 w-full flex flex-col gap-4">
        <!-- Text container fills remaining space -->
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <h3 class="text-sm font-semibold">
            {{ article?.title }}
          </h3>
          <p class="text-xs text-neutral-400 mb-2">
            {{ $dayjs(article?.created_at).format('MMMM D, YYYY') }}
          </p>
        </div>

        <div class="flex justify-start gap-2">
          <!-- TODO: Have n8n choose widgets to show -->
          <!-- TODO: Capture stock price when this was published -->
          <CustomButtonsShiny variant="pill">
            Up 10% since this news
          </CustomButtonsShiny>
          <CustomButtonsShiny variant="pill">
            {{ article?.sentiment }}
          </CustomButtonsShiny>
        </div>
      </div>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { ar } from 'zod/v4/locales'
import { useGlobalDrawerDialogStore } from '~~/stores/globalDrawerDialog'
import { usePortfoliosStore } from '~~/stores/portfolios'

const props = defineProps<{
  symbol?: string
}>()

const { $dayjs } = useNuxtApp()

const portfoliosStore = usePortfoliosStore()
const { positions } = storeToRefs(portfoliosStore)

const symbols = computed(() => {
  return props.symbol
    ? [props.symbol]
    : positions.value.map((pos) => `${pos.symbol}.${pos.exchange}`)
})

const modal = useGlobalDrawerDialogStore()

function openArticle(article: ArticleData) {
  modal.openModal({
    componentName: 'article',
    componentProps: {
      article,
    },
    backdropClose: true,
    escClose: true,
  })
}

const { data: articles, pending } = await useAsyncData(
  'portfolio-articles',
  () =>
    $fetch<ArticleData[]>('/api/article/get-latest', {
      params: { tickers: symbols.value.join(',') },
    }),
)
console.log(articles)
</script>
