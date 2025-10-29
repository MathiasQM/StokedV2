<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import type { Dayjs } from 'dayjs'

const { $dayjs } = useNuxtApp()

const props = withDefaults(
  defineProps<{
    modelValue: Dayjs
    dateFormat?: string
    minDate?: Dayjs
    maxDate?: Dayjs
    disableFuture?: boolean
  }>(),
  {
    dateFormat: 'ddd D',
    disableFuture: false,
  },
)

const emit = defineEmits(['update:modelValue'])

const emblaApi = ref<CarouselApi>()
const activeIndex = ref(-1)
const today = $dayjs().endOf('day')
const START_PAGE = 1

const isDateDisabled = (date: Dayjs): boolean => {
  if (props.minDate && date.isBefore(props.minDate, 'day')) return true
  if (props.maxDate && date.isAfter(props.maxDate, 'day')) return true
  if (props.disableFuture && date.isAfter(today, 'day')) return true
  return false
}

const startOfCurrentWeek = today.startOf('week')
const startDate = startOfCurrentWeek.subtract(7, 'day')
const dates = Array.from({ length: 21 }, (_, i) => {
  return startDate.add(i, 'day')
})

const dateGroups = computed(() => {
  return [dates.slice(0, 7), dates.slice(7, 14), dates.slice(14, 21)]
})

const handleDateClick = (date: Dayjs, globalIndex: number) => {
  if (isDateDisabled(date)) return
  activeIndex.value = globalIndex
  emit('update:modelValue', date)
}

watch(
  () => props.modelValue,
  (newDate) => {
    if (!newDate) return
    const newGlobalIndex = dates.findIndex((d) => d.isSame(newDate, 'day'))

    if (newGlobalIndex === -1 || isDateDisabled(dates[newGlobalIndex])) {
      activeIndex.value = -1
      return
    }

    activeIndex.value = newGlobalIndex
  },
  { immediate: true },
)
</script>

<template>
  <Carousel
    class="w-full max-w-md bg-neutral-900 border-1 border-neutal-500 px-3 rounded-lg"
    :opts="{
      startIndex: START_PAGE,
    }"
    @get-api="(api) => (emblaApi = api)"
  >
    <CarouselContent>
      <CarouselItem
        v-for="(group, pageIndex) in dateGroups"
        :key="pageIndex"
        class="basis-full"
      >
        <div class="flex -mx-1">
          <div
            v-for="(date, dateIndex) in group"
            :key="date.toISOString()"
            class="basis-1/7 px-1"
          >
            <Card
              :class="[
                'transition-all rounded-md',
                { 'opacity-40 pointer-events-none': isDateDisabled(date) },
                {
                  ' text-orange-500 ring-1 ring-primary':
                    pageIndex * 7 + dateIndex === activeIndex,
                },
              ]"
              class="w-10 h-auto bg-transparent my-3 p-0"
              @click="handleDateClick(date, pageIndex * 7 + dateIndex)"
            >
              <CardContent
                class="relative h-12 p-0 flex flex-col items-center justify-center gap-2"
                :class="{ 'cursor-pointer': !isDateDisabled(date) }"
              >
                <!-- Today indicator -->
                <span
                  class="absolute block w-1 h-1 rounded-full mt-1 -top-3"
                  :class="
                    date.isSame(today, 'day')
                      ? 'bg-orange-500'
                      : 'bg-transparent'
                  "
                >
                </span>
                <!-- Date number -->
                <span class="text-xs text-white font-bold leading-none">
                  {{ date.format('D') }}
                </span>
                <!-- Day of the week -->
                <span class="text-[8px] leading-none">
                  {{ date.format('ddd').toUpperCase() }}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </CarouselItem>
    </CarouselContent>
  </Carousel>
</template>
