<template>
  <AppContainer disablePaddingx title="Account Settings">
    <div
      class="lg:hidden w-full h-42 flex flex-col justify-center items-center space-y-2"
    >
      <h2 class="first-letter:uppercase text-3xl font-semibold">
        {{ user?.name }}
      </h2>
      <h3 class="text-sm font-medium">{{ user?.email }}</h3>
      <h4 class="text-xs font-normal text-black-400">{{ user?.id }}</h4>
    </div>
    <div class="fixed inset-0 -z-10 flex justify-center">
      <div class="linear-gradient-layer absolute -z-1"></div>
      <div class="linear-gradient-layer-bottom absolute -z-1"></div>
      <div class="radial-gradient-layer absolute -z-1"></div>
    </div>
    <div
      class="relative mb-5 pl-5 flex justify-start gap-x-2 w-full rounded-md p-1 overflow-auto"
    >
      <span
        class="absolute bg-white h-[3px] rounded-full block bottom-1 transition-all duration-300 ease-in-out"
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

    <div ref="swipeContainer" class="overflow-hidden pt-1">
      <div class="flex" :style="containerStyle">
        <div v-for="tab in tabs" :key="tab" class="w-full flex-shrink-0 px-5">
          <AppUserSettingsView v-if="tab === 'settings'" />
          <div class="space-y-8" v-if="tab === 'portfolio'">
            <AppPortfolioSettings v-if="portfolios.length > 0" />
            <AppPortfolioSettingsMembers v-if="portfolios.length > 0" />
            <AppPortfolioDelete v-if="portfolios.length > 0" />
            <div v-if="portfolios.length === 0" class="h-20 w-full p-5">
              <p class="text-sm text-neutral-500">
                You don't have any portfolios yet. Create one to get started!
              </p>
            </div>
          </div>
          <AppUserSettingsSecurity v-if="tab === 'security'" />
          <AppUserSettingsBilling v-if="tab === 'billing'" />
          <div
            v-if="tab === 'support'"
            class="bg-neutral-900 p-3 border border-neutral-800 rounded-lg"
          >
            <AppFeedbackForm />
          </div>
        </div>
      </div>
    </div>
  </AppContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onBeforeUpdate } from 'vue'
import { useSwipe, useElementSize } from '@vueuse/core'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const { user } = useUserSession()
const { portfolios } = usePortfolio()
const tabs = ['settings', 'portfolio', 'billing', 'security', 'support']
const activeTab = ref(route.query.tab || tabs[0])
const activeTabIndex = computed(() => tabs.indexOf(activeTab.value))
const dragOffset = ref(0)

const tabButtonRefs = ref<HTMLButtonElement[]>([])

onBeforeUpdate(() => {
  tabButtonRefs.value = []
})

const underlineStyle = computed(() => {
  const activeButton = tabButtonRefs.value[activeTabIndex.value]
  if (!activeButton) {
    return { opacity: 0 }
  }

  // Get the computed style of the button to read its padding
  const style = window.getComputedStyle(activeButton)
  const paddingLeft = parseFloat(style.paddingLeft)
  const paddingRight = parseFloat(style.paddingRight)

  // Calculate the new width (total width - horizontal padding)
  const newWidth = activeButton.offsetWidth - paddingLeft - paddingRight

  // Calculate the new position (original position - left padding)
  const newTranslateX = activeButton.offsetLeft - (paddingLeft - 3)

  return {
    width: `${newWidth}px`,
    transform: `translateX(${newTranslateX}px)`,
    opacity: 1,
  }
})

// --- Swipe Logic ---
const swipeContainer = ref<HTMLElement | null>(null)
const { width } = useElementSize(swipeContainer)
let isIgnoredSwipe = false

const { isSwiping, coordsStart, coordsEnd } = useSwipe(swipeContainer, {
  onSwipeStart: (e: TouchEvent) => {
    const target = e.target as HTMLElement
    isIgnoredSwipe = !!target.closest('.no-swipe')
  },
  onSwipe: () => {
    if (isIgnoredSwipe) return

    let offset = distanceX.value

    if (activeTabIndex.value === 0 && offset > 0) {
      offset *= 0.4
    } else if (activeTabIndex.value === tabs.length - 1 && offset < 0) {
      offset *= 0.4
    }

    dragOffset.value = offset
  },
  onSwipeEnd: () => {
    if (isIgnoredSwipe) {
      isIgnoredSwipe = false
      return
    }
    const swipeThreshold = width.value / 4
    if (Math.abs(distanceX.value) > swipeThreshold) {
      if (distanceX.value < 0 && activeTabIndex.value < tabs.length - 1) {
        activeTab.value = tabs[activeTabIndex.value + 1]
      } else if (distanceX.value > 0 && activeTabIndex.value > 0) {
        activeTab.value = tabs[activeTabIndex.value - 1]
      }
    }
    dragOffset.value = 0
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
</script>
