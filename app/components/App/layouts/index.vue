<template>
  <header class="relative z-30 flex w-full flex-col justify-end px-5 h-10">
    <div class="flex w-full items-end justify-between">
      <TransitionGroup tag="div" name="nav" class="flex items-center gap-3">
        <UButton
          v-if="showBackButton"
          key="back"
          variant="ghost"
          class="bg-black-800 aspect-square flex-shrink-0 rounded-full p-1 text-white"
          @click="router.back()"
        >
          <UIcon name="i-lucide-chevron-left" class="size-5" />
        </UButton>

        <AppPortfolioDropdown key="portfolio" />
      </TransitionGroup>

      <div>
        <slot name="actions" />
      </div>

      <div v-if="isSuperAdmin" class="flex items-center gap-2">
        <CustomButtonsShiny width="w-12">{{ countdown }}</CustomButtonsShiny>

        <CustomButtonsShiny
          width="w-8"
          height="h-8"
          variant="square"
          @click="
            navigateTo(
              isSuperAdminRoute ? '/dashboard' : '/dashboard/super-admin',
            )
          "
          ><Icon
            :name="
              isSuperAdminRoute
                ? 'i-lucide-shield-off'
                : 'i-material-symbols-shield-rounded'
            "
            class="size-4"
        /></CustomButtonsShiny>
      </div>
    </div>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <AppLayoutsNav />
  </footer>
</template>

<script lang="ts" setup>
const route = useRoute()
const router = useRouter()
const { user } = useUserSession()
const { countdown } = useIntervalRefresh()

const isSuperAdmin = computed(() => user.value?.superAdmin)
const isSuperAdminRoute = computed(() => {
  return route.path.startsWith('/dashboard/super-admin')
})
const baseRoutes = ['/dashboard', '/market', '/news']
const hasPreviousHistory = computed(() => {
  if (import.meta.client) {
    const st = window.history.state
    return !!st && st.back !== null
  }
})
const showBackButton = computed(
  () => hasPreviousHistory?.value && !baseRoutes.includes(route.path),
)

// const isSuperAdminRoute = computed(() => {
//   return route.path.startsWith('/dashboard/super-admin')
// })
</script>

<style scoped>
.nav-enter-active,
.nav-leave-active {
  transition: opacity 0.25s ease;
}

.nav-enter-from,
.nav-leave-to {
  opacity: 0;
}

.nav-move {
  transition: transform 0.25s ease;
}

.nav-leave-active {
  position: absolute;
}
</style>
