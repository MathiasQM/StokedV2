<script setup lang="ts">
import PodcastPlayer from '@/components/podcasts/Player.vue'
import InlineRenderer from '@/components/podcasts/InlineRenderer.vue'
import { useNewsFeed } from '~/composables/market/useNews'

const ticker = ref('AAPL')
const loading = ref(false)
const article = ref<any>(null)
const audioSrc = ref<string>('')
const cues = ref<any[]>([])

const { fetchNews } = useNewsFeed()

const { data: news } = await useAsyncData(`news:${ticker.value}`, () =>
  fetchNews(ticker.value, 5),
)

// watchEffect(() => console.log('[news]', news.value))

console.log(news.value)

async function run() {
  if (!news.value?.length) {
    console.warn(
      'No news to generate from yet. Try another ticker or increase limit.',
    )
    return
  }
  loading.value = true
  try {
    console.log('getting or creating podcast for', ticker.value)

    // ONE single API call to get everything
    const result = await $fetch('/api/podcast', {
      method: 'POST',
      body: { ticker: ticker.value, providerNews: news.value },
    })

    console.log('Complete podcast received:', result)
    article.value = result.articleJson
    audioSrc.value = result.audioUrl
    cues.value = result.cues
    console.log('[cues]', result.cues)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto space-y-8 px-4 py-8">
    <h1 class="text-2xl font-bold">News → Article + Podcast (POC)</h1>

    <div class="flex items-end gap-3">
      <div>
        <label class="text-xs opacity-70">Ticker</label>
        <input v-model="ticker" class="rounded bg-zinc-800/60 px-3 py-2" />
      </div>
      <button
        @click="run"
        class="rounded-xl bg-blue-600 px-4 py-2 font-medium"
        :disabled="loading"
      >
        {{ loading ? 'Generating…' : 'Generate' }}
      </button>
    </div>
    <ClientOnly>
      <div v-if="audioSrc" class="space-y-6">
        <PodcastPlayer :audio-src="audioSrc" :cues="cues" />
        <hr class="border-zinc-700/50" />
        <InlineRenderer :article="article" />
      </div>
      <p v-else class="opacity-70">
        Click Generate to build a fresh article + synced podcast.
      </p>
    </ClientOnly>
  </div>
</template>
