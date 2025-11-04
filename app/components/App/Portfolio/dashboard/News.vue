<template>
  <div class="w-full h-screen flex flex-col items-center gap-3">
    <p v-if="pending">Loading articles...</p>
    <p v-else-if="!articles || articles.length === 0">No articles found.</p>

    <CustomCard
      enableBorderFlare
      v-else
      v-for="(article, index) in articles"
      :key="index"
      class="min-h-32! w-full p-2"
    >
      <div class="w-full h-32 flex flex-col gap-4 items-center overflow-hidden">
        <!-- <div class="bg-orange-500 w-full rounded-lg flex-1"></div> -->
        <div class="flex-0">
          <h3 class="text-sm font-semibold">{{ article?.ticker }}</h3>
          <h3 class="text-sm font-semibold">{{ article?.title }}</h3>
          <p class="text-xs text-neutral-400 mb-2">
            {{ $dayjs(article?.created_at).format('MMMM D, YYYY') }}
          </p>
        </div>
        <!-- <CustomButtonsShiny @click="openArticle(article)" variant="pill"
        >News</CustomButtonsShiny
        > -->
      </div>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { useGlobalDrawerDialogStore } from '~~/stores/globalDrawerDialog'
import { usePortfoliosStore } from '~~/stores/portfolios'

const { $dayjs } = useNuxtApp()

const portfoliosStore = usePortfoliosStore()
const { positions } = storeToRefs(portfoliosStore)

const symbols = computed(() => {
  return positions.value.map((pos) => `${pos.symbol}.${pos.exchange}`)
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
</script>
