<template>
  <UApp class="bg-red-500/4530" :toaster="{ position: 'top-center' }">
    <template v-if="useMobile">
      <div class="h-full">
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
