<template>
  <>
  <!-- 
      New Fullscreen Overlay
      - Uses <Transition> for a smooth fade-in/out.
      - v-if="isSearchOpen" controls its visibility.
      - 'fixed inset-0' makes it fullscreen.
      - 'backdrop-blur-sm' creates the frosted glass effect.
      - 'z-30' places it behind the nav bar.
      - @click closes the search.
    -->
  <Transition
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isSearchOpen"
      @click="isSearchOpen = false"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300 ease-in-out"
    ></div>
  </Transition>

  <!-- 
      Existing Nav Bar Container
      - Added 'z-40' to ensure it's on top of the new overlay.
    -->
  <div
    class="fixed bottom-0 left-0 right-0 w-full flex justify-center gap-2 p-4 z-40"
  >
    <!-- 
      This is now the SINGLE container for both states.
      - 'overflow-hidden' is the key to the vertical slide animation.
    -->
    <nav
      class="h-15 relative flex w-full max-w-md items-center justify-between rounded-full border-1 border-black-100 dark:border-black-800 dark:bg-black-500/10 p-1 shadow-lg select-none backdrop-blur-md overflow-hidden"
    >
      <!-- 
        PANEL 1: NAV ITEMS
        - This div holds the nav buttons and the sliding indicator.
        - It's positioned absolutely.
        - It slides UP ('-translate-y-full') when search is open.
      -->
      <div
        class="absolute inset-0 flex items-center justify-between p-1 transition-transform duration-300 ease-in-out"
        :class="[isSearchOpen ? '-translate-y-full' : 'translate-y-0']"
      >
        <!-- Sliding Indicator -->
        <span
          class="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out"
          :style="indicatorStyle"
        ></span>

        <!-- Nav Buttons -->
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
            v-if="item.link !== '/watchlists'"
            :name="item.iconName"
            class="w-6 h-6 flex-shrink-0"
          />
          <AppLogo
            v-else
            :background="displayIndex === index ? '#000' : '#fff'"
            class="w-6 h-6"
          />
          <span
            :class="[
              'text-md font-medium overflow-hidden text-left',
              displayIndex === index ? 'w-16' : 'w-0',
            ]"
            >{{ item.text }}</span
          >
        </button>

        <!-- Search Trigger Button -->
        <button
          @click="openSearch"
          :class="[
            'relative z-10 flex items-center justify-center rounded-full px-3.5 py-2.5 text-white hover:text-gray-300 transition-colors duration-300 outline-none focus:outline-none',
          ]"
        >
          <Icon name="i-lucide-search" class="w-6 h-6 flex-shrink-0" />
        </button>
      </div>

      <!-- 
        PANEL 2: SEARCH INPUT
        - This div holds the search input and close button.
        - It's also positioned absolutely.
        - It starts ABOVE ('-translate-y-full') and slides DOWN ('translate-y-0')
          when search is open. This is the change.
      -->
      <div
        class="absolute inset-0 flex w-full items-center gap-2 px-3 transition-transform duration-300 ease-in-out"
        :class="[isSearchOpen ? 'translate-y-0' : '-translate-y-full']"
      >
        <Icon name="i-lucide-search" class="w-6 h-6 flex-shrink-0" />
        <input
          ref="searchInput"
          type="text"
          placeholder="Search..."
          class="w-full bg-transparent text-white placeholder-gray-400 outline-none"
          @keydown.esc="isSearchOpen = false"
          @click.stop
        />
        <button @click.stop="isSearchOpen = false" class="outline-none">
          <Icon name="i-lucide-x" class="w-6 h-6 flex-shrink-0" />
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'

// --- State ---
const isSearchOpen = ref(false)
const searchInput = ref(null)

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
  // Prevent hover state from updating when search is open
  if (isSearchOpen.value) return activeIndex.value
  return hoveredIndex.value !== null ? hoveredIndex.value : activeIndex.value
})

// --- Methods ---

/**
 * Opens the search bar and focuses the input.
 */
async function openSearch() {
  if (isSearchOpen.value) return
  isSearchOpen.value = true
  // Reset hover index to null when opening search
  hoveredIndex.value = null
  // Wait for the input to be rendered
  await nextTick()
  searchInput.value?.focus()
}

/**
 * Calculates and updates the position and width of the
 * sliding indicator based on the current displayIndex.
 */
function updateIndicator() {
  // Don't update indicator if search is open
  if (isSearchOpen.value) {
    indicatorStyle.value.opacity = 0
    return
  }

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

/**
 * Watch for search state changes to update the indicator.
 * When search opens/closes, we need to re-calculate/hide the indicator.
 */
watch(isSearchOpen, () => {
  // When search closes, update indicator to slide back
  nextTick(updateIndicator)
})
</script>
