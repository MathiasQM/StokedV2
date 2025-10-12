<template>
  <div>
    <UApp :toaster="{ position: 'top-center' }">
      <template v-if="useMobile">
        <div class="h-full overflow-x-hidden">
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
  </div>
</template>

<script setup lang="ts">
import { AppLayoutsMobile, AppLayoutsDesktop } from '#components'
const useMobile = useIsMobile()

const isSidebarOpen = ref(false)
</script>
