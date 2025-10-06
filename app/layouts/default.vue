<template>

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
</template>

<script setup lang="ts">
import { AppLayoutsMobile, AppLayoutsDesktop } from '#components'
const useMobile = useIsMobile()

const isSidebarOpen = ref(false)
</script>
