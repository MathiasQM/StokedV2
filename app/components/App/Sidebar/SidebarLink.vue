<template>
  <div class="relative">
    <ULink
      :to="linkTo"
      exact
      class="relative flex w-20 flex-col items-center gap-2 p-2 font-medium md:w-full md:flex-row md:rounded-md dark:hover:bg-white/10"
      active-class=" md:text-neutral-900 dark:text-white md:dark:text-white md:bg-neutral-200/70 md:dark:bg-white/10 md:hover:bg-neutral-200/80"
      inactive-class="text-[var(--ui-text-muted)]"
      @click="handleClick($event)"
      v-slot="{ active }"
    >
      <UIcon :name="icon" class="h-5 w-5 md:h-4 md:w-4" />

      <p class="text-xs md:text-sm">{{ label }}</p>
      <Transition name="fade">
        <div
          v-if="active"
          class="gradient-overlay pointer-events-none absolute inset-0 rounded-md"
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
import { useCountryProviderModal } from '@@/stores/countryProviderModal'
import { usePortfolio } from '@/composables/usePortfolio'
import { syncViaPlaid } from '@@/services/utilities/helpers'

const { triggerHaptic } = useHaptic()

const cpModal = useCountryProviderModal()

const { portfolios } = usePortfolio()

async function startPortfolioSync() {
  const choice = await cpModal.pickProvider()

  if (!choice) return

  if (choice.securityProvider === 'Plaid') {
    await syncViaPlaid(choice)
  } else if (choice.securityProvider === 'Tink') {
    return console.warn('Tink is not supported yet')

    // await syncViaTink(choice)
  } else {
    console.warn('Unsupported provider', choice)
  }
}

const mobileMenu = useState('mobileMenu')

const props = defineProps<{
  requirePortfolio?: boolean

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

  if (props.requirePortfolio && portfolios.value.length === 0) {
    e.preventDefault()

    startPortfolioSync()

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
