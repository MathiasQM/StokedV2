<template>
  <div class="relative">
    <ULink
      draggable="false"
      :to="linkTo"
      exact
      class="relative flex flex-col items-center gap-2 p-2 font-medium md:w-full md:flex-row md:rounded-md dark:hover:bg-white/10"
      active-class=" md:text-neutral-900 dark:text-white md:dark:text-white md:bg-neutral-200/70 md:dark:bg-white/10 md:hover:bg-neutral-200/80"
      inactive-class="text-[var(--ui-text-muted)]"
      @click="handleClick($event)"
      v-slot="{ active }"
    >
      <UIcon :name="icon" class="h-6 w-6 md:h-4 md:w-4" />

      <p class="text-xs">{{ label }}</p>
      <Transition name="fade">
        <div
          v-if="active"
          class="hidden md:block gradient-overlay pointer-events-none absolute inset-0 rounded-md"
        >
          <span
            class="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-t-lg bg-orange-500 opacity-70 md:top-[6px] md:right-0 md:bottom-auto md:left-auto md:h-6 md:w-[3px] md:-translate-x-0 md:rounded-t-none md:rounded-l-lg"
          ></span>
        </div>
      </Transition>
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

const linkTo = computed(() => (props.onSelect ? undefined : props.to))

function handleClick(e: MouseEvent) {
  triggerHaptic()

  // Handle the custom onSelect event if provided.

  if (props.onSelect) {
    props.onSelect(e)
  }

  console.log(portfolios.value)

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

<style scoped>
.gradient-overlay {
  /* Mobile-first: Gradient from the bottom center */
  background-image: radial-gradient(
    circle at center 100%,
    #ff500070 0%,
    transparent 50%
  );
}

@media (min-width: 768px) {
  /* Tailwind's 'md' breakpoint */
  .gradient-overlay {
    /* Desktop: Gradient from the right center */
    background-image: radial-gradient(
      circle at 100% center,
      #ff500050 0%,
      transparent 50%
    );
  }
}
</style>
