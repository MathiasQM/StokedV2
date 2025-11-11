<template>
  <div class="relative">
    <ULink
      ref="linkRef"
      draggable="false"
      :to="linkTo"
      exact
      @click="handleClick($event)"
      v-slot="{ active }"
      :class="[
        'relative flex items-center gap-2 font-medium',
        isVisuallyActive ? 'px-5 py-3' : 'px-2 py-2',
      ]"
      active-class=""
      inactive-class=""
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <ActiveStateWatcher
        :is-active="active"
        @set-active="onActiveStateChange"
      />

      <div
        class="flex items-center gap-2 mix-blend-difference text-white"
        :class="[
          // We can add a transition for the text/icon opacity if you want
          isVisuallyActive ? 'opacity-100' : 'opacity-70 transition-opacity',
        ]"
      >
        <UIcon v-if="icon !== 'watchlist'" :name="icon" class="h-6 w-6" />

        <AppLogo v-else class="h-6 w-6" />

        <p
          :class="!isVisuallyActive ? 'hidden' : ''"
          class="text-md font-medium"
        >
          {{ label }}
        </p>
      </div>
    </ULink>
  </div>
</template>

<script lang="ts" setup>
import { usePortfolio } from '@/composables/usePortfolio'
import { useAuthModal } from '~~/stores/authModal'
import { usePortfolioSetupModal } from '~~/stores/portfolioSetupModal'

const { triggerHaptic } = useHaptic()
const { loggedIn } = useUserSession()

// const cpModal = useCountryProviderModal()
const authStore = useAuthModal()
const portfolioSetupModal = usePortfolioSetupModal()

const { portfolios } = usePortfolio()
const mobileMenu = useState('mobileMenu')

const props = defineProps<{
  requirePortfolio?: boolean
  requireAuthentication?: boolean
  to: string
  icon: string
  label: string
  onSelect?: (event: Event) => void
}>()

const ActiveStateWatcher = defineComponent({
  props: {
    isActive: Boolean,
  },
  emits: ['setActive'],
  setup(props, { emit }) {
    watch(
      () => props.isActive,
      (newValue) => {
        // NEW: Pass the boolean value back
        emit('setActive', newValue)
      },
      { immediate: true }, // Fire immediately on load
    )

    return () => h('span', { style: 'display: none;' }) // Renders nothing
  },
})

// Inject the functions provided by the parent
const navIndicator = inject('nav-indicator', {
  setActiveElement: (el: HTMLElement) => {},
  updateIndicator: (el: HTMLElement) => {},
  resetIndicator: () => {},
  activeHoverElement: ref<HTMLElement | null>(null), // <-- NEW
})

const { activeHoverElement, updateIndicator, setActiveElement } = navIndicator

const linkRef = ref<any>(null) // Ref to the ULink component
let linkElement: HTMLElement | null = null // To store the actual <a> DOM node
const isHovered = ref(false)
const isRouteActive = ref(false)

/**
 * Gets the root <a> element rendered by ULink.
 */
const getLinkElement = (): HTMLElement | null => {
  if (linkElement) return linkElement
  if (linkRef.value?.$el) {
    linkElement = linkRef.value.$el
    return linkElement
  }
  return null
}

onMounted(() => {
  getLinkElement()
})

// NEW: This is the ONLY computed property we need for styling
const isVisuallyActive = computed(() => {
  return activeHoverElement.value === getLinkElement()
})

/**
 * Called by ActiveStateWatcher when route active state changes.
 */
const onActiveStateChange = (isActive: boolean) => {
  isRouteActive.value = isActive
  if (isActive) {
    nextTick(() => {
      const el = getLinkElement()
      if (el) {
        setActiveElement(el)
      }
    })
  }
}

/**
 * Called on hover to update state and move the indicator.
 */
const onMouseEnter = () => {
  isHovered.value = true
  nextTick(() => {
    const el = getLinkElement()
    if (el) {
      updateIndicator(el) // Tell the parent to move the indicator to me
    }
  })
}

/**
 * NEW: Called on mouse leave to update state.
 * The parent's @mouseleave will handle resetting the indicator.
 */
const onMouseLeave = () => {
  isHovered.value = false
}

const linkTo = computed(() => (props.onSelect ? undefined : props.to))

function handleClick(e: MouseEvent) {
  triggerHaptic()

  if (props.onSelect) {
    props.onSelect(e)
  }

  if (props.requireAuthentication && !loggedIn.value) {
    e.preventDefault()
    authStore.openAuthModal()
  } else if (props.requirePortfolio && portfolios.value.length === 0) {
    e.preventDefault()
    portfolioSetupModal.openPortfolioSetupModal()

    mobileMenu.value = false
  } else {
    navigateTo(linkTo.value)
  }
}
</script>
