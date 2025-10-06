<!-- pages/dev/podcast-live.vue -->
<script setup lang="ts">
const mockArticleJson = {
  script: {
    words: 40,
    sections: [
      {
        id: 'cold_open',
        voice: 'Host',
        style: ['narration'],
        text: 'Apple reported steady services growth today.',
        sentences: [
          {
            id: 'cold_open.s1',
            text: 'Apple reported steady services growth today.',
            tokens: [
              { id: 'cold_open.s1.t1', text: 'Apple' },
              { id: 'cold_open.s1.t2', text: 'reported' },
              { id: 'cold_open.s1.t3', text: 'steady' },
              { id: 'cold_open.s1.t4', text: 'services' },
              { id: 'cold_open.s1.t5', text: 'growth' },
              { id: 'cold_open.s1.t6', text: 'today' },
            ],
          },
        ],
      },
      {
        id: 'key_data',
        voice: 'Analyst',
        style: ['thoughtful'],
        text: 'Revenue grew eight percent; free cash flow remains robust.',
        sentences: [
          {
            id: 'key_data.s1',
            text: 'Revenue grew eight percent; free cash flow remains robust.',
            tokens: [
              { id: 'key_data.s1.t1', text: 'Revenue' },
              { id: 'key_data.s1.t2', text: 'grew' },
              { id: 'key_data.s1.t3', text: 'eight' },
              { id: 'key_data.s1.t4', text: 'percent' },
              { id: 'key_data.s1.t5', text: 'free' },
              { id: 'key_data.s1.t6', text: 'cash' },
              { id: 'key_data.s1.t7', text: 'flow' },
              { id: 'key_data.s1.t8', text: 'remains' },
              { id: 'key_data.s1.t9', text: 'robust' },
            ],
          },
        ],
      },
    ],
  },
  render_cues: [
    {
      trigger: { type: 'section', id: 'cold_open', at: 'start' },
      components: [{ type: 'LogoChip', params: { ticker: 'AAPL' } }],
    },
    {
      trigger: {
        type: 'match',
        query: 'services',
        occurrence: 1,
        scope: 'cold_open',
      },
      components: [
        {
          type: 'ImagePanel',
          params: { src: '/images/iphone.jpg', caption: 'Services' },
        },
      ],
    },
    {
      trigger: { type: 'sentence', id: 'key_data.s1', at: 'end' },
      components: [
        {
          type: 'KPIList',
          params: {
            items: [
              { label: 'Revenue YoY', value: '+8%' },
              { label: 'FCF TTM', value: '$99B' },
            ],
          },
        },
      ],
    },
  ],
}

const { data, error } = await useFetch('/api/podcast/generate', {
  method: 'POST',
  body: { articleJson: mockArticleJson },
})

if (error.value) {
  console.error(error.value)
}

const audioSrc = computed(() => {
  // for now, use a data URL. Replace with real URL after you save to storage.
  const b64 = data.value?.audioBase64
  return b64 ? `data:audio/mpeg;base64,${b64}` : ''
})
const cues = computed(() => data.value?.cues ?? [])
</script>

<template>
  <div class="container mx-auto space-y-8 px-4 py-8">
    <h1 class="text-2xl font-bold">Podcast (live timestamps)</h1>
    <ClientOnly>
      <PodcastsPlayer v-if="audioSrc" :audio-src="audioSrc" :cues="cues" />
    </ClientOnly>
  </div>
</template>
