<template>
  <UApp :toaster="{ position: 'top-center' }">
    <template v-if="useMobile">
      <div>
        <AppLayoutsMobile v-model:open="isSidebarOpen">
          <AppPopupsChoosePortfolios />

          <slot />
        </AppLayoutsMobile>
      </div>
    </template>

    <template v-else>
      <AppLayoutsDesktop v-model:open="isSidebarOpen">
        <AppPopupsChoosePortfolios />
        <slot />
      </AppLayoutsDesktop>
    </template>
  </UApp>
</template>

<script setup lang="ts">
import { AppLayoutsMobile, AppLayoutsDesktop } from '#components'
const useMobile = useIsMobile()

const isSidebarOpen = ref(false)
</script>
