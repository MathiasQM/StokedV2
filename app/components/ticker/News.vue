<script setup lang="ts">
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useNewsFeed } from '~/composables/market/useNews'

const { symbol } = defineProps<{
  symbol: string
}>()

const { fetchNews } = useNewsFeed()

const {
  data: news,
  status: newsStatus,
  error: newsErr,
} = await useAsyncData(`news:${symbol}`, () => fetchNews(symbol, 5))

console.log('TickerNews', news.value)

const handleOpenArticle = (url: string) => {
  window.open(url, '_blank')
}

const calculateSentimentPolarity = computed(() => {
  if (!news.value || news.value.length === 0) return 'neutral'

  const polarities = news.value.map((item) => item?.sentiment?.polarity)
  const avgPolarity =
    polarities.reduce((sum, p) => sum + p, 0) / polarities.length

  if (avgPolarity >= 0.6) return 'positive'
  if (avgPolarity <= 0.4) return 'negative'
  return 'neutral'
})

const newsSourceIcon = (url: string) =>
  `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`
</script>
<template>
  <ElementsCard class="p-3">
    <div class="flex h-32 w-full items-center gap-5">
      <h3 class="text-xl font-semibold">Latest news</h3>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              :class="`bg-${calculateSentimentPolarity} text-white`"
              class="text-xs font-semibold first-letter:uppercase"
            >
              {{ calculateSentimentPolarity }}</Badge
            >
          </TooltipTrigger>
          <TooltipContent>
            <p>
              News sentiment is generally {{ calculateSentimentPolarity }} at
              the moment
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <p v-if="newsStatus !== 'success'" class="text-gray-400">
      Fetching headlines…
    </p>

    <Carousel
      v-else
      :opts="{
        align: 'start',
        loop: true,
      }"
      :plugins="[
        Autoplay({
          delay: 10000,
        }),
      ]"
    >
      <CarouselContent>
        <CarouselItem
          v-for="item in news"
          :key="item.id"
          @click="handleOpenArticle(item.link)"
        >
          <Card>
            <CardHeader>
              <div class="flex items-center">
                <Avatar class="rounde-full mr-2 h-5 w-5">
                  <AvatarImage :src="newsSourceIcon(item.link)" alt="@unovue" />
                </Avatar>
                <CardTitle>{{ item.title }}</CardTitle>
              </div>
              <p class="text-xs">
                {{ useDateFormat(item.date, 'YYYY-MM-DD HH:MM') }}
              </p>
              <CardDescription
                class="max-h-20 w-full overflow-hidden text-xs text-ellipsis"
                v-html="item.content"
              >
              </CardDescription>
              <div class="mt-2 flex items-center gap-2">
                <p class="text-black-300 text-xs">Mentioned Tickers:</p>
                <Avatar v-for="symbol in item.symbols" class="">
                  <!-- <AvatarImage :src="newsSourceIcon(item.link)" alt="@unovue" /> -->
                  <AvatarFallback>
                    <p>
                      {{ symbol }}
                    </p>
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardHeader>
          </Card>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  </ElementsCard>
</template>

<style scoped>
.bg-positive {
  border: 1px solid #4ade80;
  background-color: #4ade8070;
}

.bg-negative {
  background-color: #e84444;
}

.bg-neutral {
  background-color: #a1a1aa;
}
</style>
