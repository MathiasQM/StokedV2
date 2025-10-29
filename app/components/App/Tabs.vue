<template>
  <div class="flex flex-col flex-1 overflow-y-hidden">
    <div class="flex-shrink-0">
      <div
        class="relative mb-5 pl-5 -left-5 flex justify-start gap-x-2 w-full rounded-md p-1 overflow-y-auto"
      >
        <span
          class="absolute bg-white h-[3px] rounded-full flex bottom-1 transition-all duration-300 ease-in-out"
          :style="underlineStyle"
        ></span>

        <button
          v-for="(tab, index) in tabs"
          :key="tab"
          :ref="
            (el) => {
              if (el) tabButtonRefs[index] = el as HTMLButtonElement
            }
          "
          :class="[
            'rounded-sm px-3 py-1.5 text-sm font-medium transition-all first-letter:uppercase',
            activeTab === tab ? ' text-white' : 'text-zinc-400',
          ]"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div ref="swipeContainer" class="flex-1 overflow-hidden">
      <div class="flex h-full" :style="containerStyle">
        <div
          v-for="tab in tabs"
          :key="tab"
          class="w-full h-full overflow-y-auto flex-shrink-0 pb-28"
          :class="disablePaddingx ? '' : 'px-5'"
        >
          <slot :name="tab" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, toRef } from 'vue'
import { useSwipe, useElementSize } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    tabs: string[]
    modelValue: string
    disablePaddingx?: boolean
  }>(),
  {
    disablePaddingx: false,
  },
)

const emit = defineEmits(['update:modelValue'])

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const tabs = toRef(props, 'tabs')
const activeTabIndex = computed(() => tabs.value.indexOf(activeTab.value))
const dragOffset = ref(0)
const tabButtonRefs = ref<HTMLButtonElement[]>([])

const underlineStyle = computed(() => {
  const activeButton = tabButtonRefs.value[activeTabIndex.value]
  if (!activeButton) return { opacity: 0 }
  const style = window.getComputedStyle(activeButton)
  const paddingLeft = parseFloat(style.paddingLeft)
  const paddingRight = parseFloat(style.paddingRight)
  const newWidth = activeButton.offsetWidth - paddingLeft - paddingRight
  const newTranslateX = activeButton.offsetLeft - (paddingLeft - 3)
  return {
    width: `${newWidth}px`,
    transform: `translateX(${newTranslateX}px)`,
    opacity: 1,
  }
})

const swipeContainer = ref<HTMLElement | null>(null)
const { width } = useElementSize(swipeContainer)

const { isSwiping, coordsStart, coordsEnd } = useSwipe(swipeContainer, {
  onSwipeEnd: () => {
    const swipeThreshold = width.value / 4
    if (Math.abs(distanceX.value) > swipeThreshold) {
      if (distanceX.value < 0 && activeTabIndex.value < tabs.value.length - 1) {
        activeTab.value = tabs.value[activeTabIndex.value + 1]
      } else if (distanceX.value > 0 && activeTabIndex.value > 0) {
        activeTab.value = tabs.value[activeTabIndex.value - 1]
      }
    }
    dragOffset.value = 0
  },
  onSwipe: () => {
    let offset = distanceX.value
    const isFirst = activeTabIndex.value === 0
    const isLast = activeTabIndex.value === tabs.value.length - 1
    if ((isFirst && offset > 0) || (isLast && offset < 0)) {
      offset *= 0.4
    }
    dragOffset.value = offset
  },
})

const distanceX = computed(() => coordsEnd.x - coordsStart.x)

const containerStyle = computed(() => {
  const baseOffset = -activeTabIndex.value * width.value
  const totalOffset = baseOffset + dragOffset.value
  return {
    transform: `translateX(${totalOffset}px)`,
    transition: isSwiping.value ? 'none' : 'transform 0.3s ease-in-out',
  }
})

watch(activeTabIndex, async (newIndex) => {
  await nextTick()

  const activeButton = tabButtonRefs.value[newIndex]
  if (activeButton) {
    activeButton.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }
})
</script>
