<template>
  <header class="relative z-50 flex w-full flex-col justify-end px-5 h-10">
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
        <UButton
          block
          variant="ghost"
          @click="navigateTo('/dashboard/super-admin')"
          class="w-8 h-8 justify-normal text-left bg-neutral-800"
        >
          <UIcon name="i-lucide-shield" class="size-5 text-white" />
        </UButton>
      </div>
    </div>

    <div v-if="isSuperAdminRoute" key="super-admin">
      <AppSidebarSuperAdmin />
    </div>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <AppMobileNav />
  </footer>
</template>

<script lang="ts" setup>
const route = useRoute()
const router = useRouter()
const { user } = useUserSession()

const isSuperAdmin = computed(() => user.value?.superAdmin)

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

const isSuperAdminRoute = computed(() => {
  return route.path.startsWith('/dashboard/super-admin')
})
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
