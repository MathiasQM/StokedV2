<template>
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

  <div class="fixed bottom-0 z-30 w-full flex flex-col items-center gap-3">
    <slot v-if="!isSearchOpen" name="navActionsMenu" />

    <div
      class="w-full flex justify-center gap-2 px-2 z-40 transition-transform duration-300 ease-in-out"
      :class="'pb-4'"
      :style="{ transform: `translateY(${navTranslateY}px)` }"
    >
      <nav
        class="h-15 relative flex w-full max-w-md items-center justify-between rounded-full border-1 border-black-100 dark:border-black-800 dark:bg-black-500/10 p-1 shadow-lg select-none backdrop-blur-md overflow-hidden"
      >
        <div
          class="absolute inset-0 flex items-center justify-between p-1 transition-transform duration-300 ease-in-out"
          :class="[isSearchOpen ? '-translate-y-full' : 'translate-y-0']"
        >
          <span
            class="absolute top-1 bottom-1 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out z-0"
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
            @click="
              !item.link ? openSearch() : handleNavItemClick($event, item)
            "
            :class="[
              'relative z-10 flex items-center justify-center rounded-full px-3.5 py-2.5 transition-colors duration-300 outline-none focus:outline-none',
              displayIndex === index
                ? 'text-black'
                : 'text-white hover:text-white/80',
            ]"
          >
            <Icon
              v-if="item.link !== '/brief'"
              :name="item.iconName"
              class="w-6 h-6 flex-shrink-0"
            />

            <AppLogo
              v-else
              :background="displayIndex === index ? 'black' : 'white'"
              class="w-6 h-6"
            />

            <div
              class="grid transition-[grid-template-columns] duration-300 ease-in-out"
              :class="
                displayIndex === index ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
              "
            >
              <span class="overflow-hidden whitespace-nowrap">
                <span class="pl-2 text-md font-medium block">
                  {{ item.text }}
                </span>
              </span>
            </div>
          </button>
        </div>

        <div
          class="absolute inset-0 flex w-full items-center gap-2 px-3 transition-transform duration-300 ease-in-out"
          :class="[isSearchOpen ? 'translate-y-0' : '-translate-y-full']"
        >
          <Icon
            name="i-lucide-search"
            class="w-6 h-6 flex-shrink-0 text-white"
          />
          <input
            ref="searchInput"
            v-model="searchInputValue"
            type="text"
            placeholder="Search..."
            class="w-full bg-transparent text-white placeholder-gray-400 outline-none"
            @keydown.esc="isSearchOpen = false"
            @keydown.enter="searchInput?.blur()"
            @onBlur="isSearchOpen = false"
            @click.stop
          />
          <button
            v-if="searchInputValue !== ''"
            @click.stop="searchInput?.value && (searchInput.value = '')"
            class="outline-none text-white hover:text-gray-300"
          >
            <Icon name="i-lucide-x" class="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </nav>
      <div
        @click.stop="
          isSearchOpen ? (isSearchOpen = false) : (isSearchOpen = true)
        "
        class="h-15 relative flex min-w-15 aspect-square items-center justify-center rounded-full border-1 border-black-100 dark:border-black-800 dark:bg-black-500/10 p-1 shadow-lg select-none backdrop-blur-md overflow-hidden"
      >
        <button class="outline-none text-white hover:text-gray-300">
          <Icon
            :name="isSearchOpen ? 'i-lucide-x' : 'i-lucide-search'"
            class="w-6 h-6 flex-shrink-0"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useAuthModal } from '~~/stores/authModal'
import { usePortfolioSetupModal } from '~~/stores/portfolioSetupModal'

const { loggedIn, user } = useUserSession()
const authStore = useAuthModal()
const portfolioStore = usePortfolioSetupModal()
const { currentPortfolio } = usePortfolio()
const route = useRoute()

const isSearchOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const searchInputValue = ref('')
const navTranslateY = ref(0)

const isAdminModeActive = computed(() => {
  const p = route.path || ''
  return user.value?.superAdmin && p.startsWith('/dashboard/super-admin')
})

type NavItem = {
  text: string
  iconName: string
  link: string
  requireAuth?: boolean
  requirePortfolio?: boolean
}

const userItems: NavItem[] = [
  {
    text: 'Brief',
    iconName: '',
    link: '/brief',
    requireAuth: false,
    requirePortfolio: true,
  },
  {
    text: 'Portfolio',
    iconName: 'i-lucide-briefcase-business',
    link: '/dashboard',
    requireAuth: true,
    requirePortfolio: true,
  },
  {
    text: 'Watchlist',
    iconName: 'i-lucide-layout-list',
    link: '/watchlists',
    requireAuth: true,
    requirePortfolio: true,
  },
  {
    text: 'Account',
    iconName: 'i-lucide-circle-user',
    link: '/account',
    requireAuth: true,
    requirePortfolio: false,
  },
]

const adminItems: NavItem[] = [
  { text: 'Users', iconName: 'i-lucide-users', link: '/dashboard/super-admin' },
  {
    text: 'Portfolios',
    iconName: 'i-lucide-users',
    link: '/dashboard/super-admin/portfolios',
  },
  {
    text: 'Plans',
    iconName: 'i-lucide-credit-card',
    link: '/dashboard/super-admin/stripe-plans',
  },
  {
    text: 'Feedback',
    iconName: 'i-lucide-message-circle',
    link: '/dashboard/super-admin/feedback-submissions',
  },
  {
    text: 'Newsletter',
    iconName: 'i-lucide-mail',
    link: '/dashboard/super-admin/newsletter-subscribers',
  },
]

const navItems = computed<NavItem[]>(() =>
  isAdminModeActive.value && !user.value?._impersonated
    ? adminItems
    : userItems,
)
const activeIndex = ref(0)
const hoveredIndex = ref(null)
const itemRefs = ref([])
const indicatorStyle = ref({
  left: '0px',
  width: '0px',
  opacity: 0,
})

function startIndicatorTracking() {
  const startTime = performance.now()
  const duration = 200

  const animate = (currentTime: number) => {
    updateIndicator()
    if (currentTime - startTime < duration) {
      animationFrameId = requestAnimationFrame(animate)
    }
  }

  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  animationFrameId = requestAnimationFrame(animate)
}

const displayIndex = computed(() => {
  if (isSearchOpen.value) return activeIndex.value
  return hoveredIndex.value !== null ? hoveredIndex.value : activeIndex.value
})

let animationFrameId: number | null = null

const handleNavItemClick = (e: Event, item: NavItem) => {
  if (
    item.link === '/dashboard/super-admin' &&
    !user.value?._impersonated &&
    user.value?.superAdmin
  ) {
    navigateTo(item.link)
    return
  }
  if (item.requireAuth && !loggedIn.value) {
    e.preventDefault()
    return authStore.openAuthModal()
  } else if (item.requirePortfolio && !currentPortfolio?.value) {
    e.preventDefault()
    return portfolioStore.openPortfolioSetupModal()
  } else {
    navigateTo(item.link)
  }
}

async function openSearch() {
  if (isSearchOpen.value) return
  isSearchOpen.value = true
  hoveredIndex.value = null
  await nextTick()
  searchInput.value?.focus()
  searchInput.value && (searchInput.value.value = '')
}

function updateIndicator() {
  if (isSearchOpen.value) {
    indicatorStyle.value.opacity = 0
    return
  }

  const el = itemRefs.value[displayIndex.value]
  if (!el) return

  indicatorStyle.value = {
    left: `${el.offsetLeft}px`,
    width: `${el.offsetWidth}px`,
    opacity: 1,
  }
}

const handleViewportResize = () => {
  const visualViewport = window.visualViewport
  if (!visualViewport) return

  const keyboardHeight = window.innerHeight - visualViewport.height

  if (keyboardHeight > 0 && isSearchOpen.value) {
    navTranslateY.value = -keyboardHeight
  } else {
    navTranslateY.value = 0
  }
}

const onWindowResize = () => nextTick(updateIndicator)

onMounted(() => {
  nextTick(() => {
    setTimeout(updateIndicator, 50)
  })

  window.addEventListener('resize', onWindowResize)

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize)
  }
})

watch(
  displayIndex,
  () => {
    startIndicatorTracking()
  },
  { flush: 'post' },
)

watch(isSearchOpen, () => {
  nextTick(updateIndicator)
})
</script>
