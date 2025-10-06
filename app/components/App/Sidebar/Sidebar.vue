<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- <AppLogo /> -->

    <Transition
      mode="out-in"
      enter-active-class="transition duration-100 ease-out"
      leave-active-class="transition duration-100 ease-in"
      enter-from-class="translate-x-1/2"
      enter-to-class="translate-x-0"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-1/2"
    >
      <div v-if="isSuperAdminRoute" key="super-admin">
        <AppSidebarSuperAdmin />
      </div>
      <div v-else key="portfolio">
        <AppSidebarPortfolio />
      </div>
    </Transition>
    <footer class="mt-auto space-y-5">
      <UButton
        v-if="!user?.proAccount"
        to="/membership"
        class="h-32 w-full"
        color="orange"
        variant="subtle"
      >
        <div class="flex w-full flex-col items-start space-y-1 text-left">
          <p class="text-xs font-semibold">Upgrade for the Full Picture</p>
          <p class="text-xs">
            Get richer data, smarter AI tools, and early access to every new
            feature.
          </p>
          <UButton
            v-if="!user?.proAccount"
            to="/membership"
            class="mt-2 w-full text-xs"
            color="orange"
            variant="subtle"
            >Upgrade</UButton
          >
        </div>
      </UButton>
      <AppUserDropdown />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { UButton } from '#components'
const { user } = useUserSession()

const route = useRoute()

const isSuperAdminRoute = computed(() => {
  return route.path.startsWith('/dashboard/super-admin')
})
</script>
