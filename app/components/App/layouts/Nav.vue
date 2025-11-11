<!-- <template>
  <div
    ref="navElement"
    class="fixed bottom-0 flex w-full justify-center p-5 transition-all select-none gap-2"
  >
    <div
      ref="linksContainerRef"
      class="relative p-1 border-black-100 dark:border-black-800 dark:bg-black-500/10 flex w-full max-w-92 items-center justify-between rounded-full border-1 bg-white/10 backdrop-blur-md isolation-isolate"
    >
      <div
        class="absolute top-1 bottom-1 bg-white -z-1 rounded-full transition-all duration-300 ease-out"
      />

      <AppLayoutsNavLink
        key="brief"
        v-bind="{
          label: 'Brief',
          icon: 'i-lucide-newspaper',
          to: `/brief`,
        }"
      />
      <div v-for="link in links">
        <AppLayoutsNavLink :key="link.to" v-bind="link" />
      </div>
    </div>
    <div
      class="h-14 w-14 aspect-square border-black-100 dark:border-black-800 dark:bg-black-500/10 flex items-center justify-center rounded-full border-1 bg-white/10 backdrop-blur-md"
    >
      <Icon name="i-lucide-search" class="size-6 text-white" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { usePortfolio } from '@/composables/usePortfolio'

const { currentPortfolio, portfolios } = usePortfolio()

const links = computed(() => [
  {
    label: 'Portfolio',
    icon: 'i-lucide-briefcase-business',
    to: `/dashboard/${currentPortfolio.value?.slug}` || '',
    requireAuthentication: true,
    requirePortfolio: true,
  },
  {
    label: 'Watchlist',
    icon: 'watchlist',
    to: `/watchlists`,
    requireAuthentication: true,
    requirePortfolio: false,
  },
  {
    label: 'Account',
    icon: 'i-lucide-circle-user',
    to: `/account`,
    requireAuthentication: true,
  },
])
</script> -->

<template>
  <div
    class="fixed bottom-0 left-0 right-0 w-full flex justify-center gap-2 p-4"
  >
    <nav
      @mouseleave="hoveredIndex = null"
      class="h-15 relative flex w-full max-w-md items-center justify-between rounded-full border-1 border-black-100 dark:border-black-800 dark:bg-black-500/10 p-1 shadow-lg select-none backdrop-blur-md"
    >
      <span
        class="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out"
        :style="indicatorStyle"
      ></span>

      <button
        v-for="(item, index) in navItems"
        :key="item.iconName"
        :ref="
          (el) => {
            if (el) itemRefs[index] = el
          }
        "
        @mouseenter="hoveredIndex = index"
        @click="((activeIndex = index), navigateTo(item.link))"
        :class="[
          'relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 transition-colors duration-300 outline-none focus:outline-none',
          displayIndex === index
            ? 'text-gray-900'
            : 'text-white hover:text-gray-300',
        ]"
      >
        <Icon
          v-if="item.link !== '/watchlist'"
          :name="item.iconName"
          class="w-6 h-6 flex-shrink-0"
        />

        <AppLogo v-else background="#000" class="w-6 h-6 flex-shrink-0" />

        <span
          :class="[
            'text-md font-medium overflow-hidden',
            displayIndex === index ? 'w-16' : 'w-0',
          ]"
          >{{ item.text }}</span
        >
      </button>
    </nav>
    <div
      class="h-15 w-15 aspect-square relative flex items-center justify-center rounded-full border-1 border-black-100 dark:border-black-800 dark:bg-black-500/10 p-1 shadow-lg select-none backdrop-blur-md"
    >
      <Icon name="i-lucide-search" class="w-6 h-6 flex-shrink-0" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
// --- State ---

// The list of navigation items
// We use shallowRef for the icon component to avoid performance overhead
const navItems = ref([
  {
    text: 'Brief',
    iconName: 'i-lucide-newspaper',
    link: '/brief',
  },
  {
    text: 'Portfolio',
    iconName: 'i-lucide-briefcase-business',
    link: '/dashboard',
  },
  {
    text: 'Watchlist',
    iconName: 'watchlist',
    link: '/watchlists',
  },
  {
    text: 'Account',
    iconName: 'i-lucide-circle-user',
    link: '/account',
  },
])

// The currently clicked/active item index
const activeIndex = ref(0)
// The currently hovered item index (null if not hovering)
const hoveredIndex = ref(null)
// An array to store the DOM elements of the nav buttons
const itemRefs = ref([])
// The dynamic style for the sliding indicator
const indicatorStyle = ref({
  left: '0px',
  width: '0px',
  opacity: 0,
})

// --- Computed ---

// The index that should be visually highlighted.
// Hover state takes precedence over active state.
const displayIndex = computed(() => {
  return hoveredIndex.value !== null ? hoveredIndex.value : activeIndex.value
})

// --- Methods ---

/**
 * Calculates and updates the position and width of the
 * sliding indicator based on the current displayIndex.
 */
function updateIndicator() {
  // Find the DOM element corresponding to the active/hovered index
  const el = itemRefs.value[displayIndex.value]
  if (!el) return

  // Update the style object. Vue will reactively apply this.
  // We use offsetLeft and offsetWidth to get the element's
  // rendered position and size relative to the nav container.
  indicatorStyle.value = {
    left: `${el.offsetLeft}px`,
    width: `${el.offsetWidth}px`,
    opacity: 1,
  }
}

// --- Lifecycle & Watchers ---

/**
 * When the component mounts:
 * 1. Wait for the DOM to be ready and layout to be calculated (hence setTimeout),
 * then run updateIndicator to position the indicator at the initial active item.
 */
onMounted(() => {
  // Use nextTick (or setTimeout) to ensure DOM is ready for measurement
  nextTick(() => {
    setTimeout(updateIndicator, 50) // A small delay for layout to settle
  })

  // Add a resize listener to recalculate position if window size changes
  window.addEventListener('resize', () => nextTick(updateIndicator))
})

/**
 * Watch for changes to 'displayIndex'.
 * When it changes (due to hover or click):
 * 1. Wait for Vue to update the DOM (e.g., apply w-0/w-16 classes).
 * 3. Call updateIndicator to animate the slider to the new position.
 * 'flush: 'post'' ensures this runs *after* DOM updates.
 */
watch(
  displayIndex,
  () => {
    nextTick(updateIndicator)
  },
  { flush: 'post' },
)
</script>
