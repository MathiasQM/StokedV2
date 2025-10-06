<template>
  <NuxtRouteAnnouncer />
  <NuxtPwaManifest />
  <div ref="wrapperRef" class="main-wrapper padding-env-top h-screen">
    <UApp :toaster="{ position: 'top-center' }">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <!-- MOVE TO LAYOUTS AS AUTH ROUTE ARE NOT AUTHENTICATED -->
      <!-- <AppPopupsChoosePortfolios  /> -->

      <AppPortfolioCountryProviderDropdown />
    </UApp>
  </div>

  <!-- IOS Haptic Feedback workaround -->
  <label for="haptic-trigger" id="haptic-label" class="hidden"></label>
  <input
    id="haptic-trigger"
    type="checkbox"
    role="switch"
    switch
    class="hidden"
  />
  <!-- IOS Haptic Feedback workaround -->
</template>

<script lang="ts" setup>
import { AppPopupsChoosePortfolios } from '#components'
const wrapperRef = ref<HTMLElement | null>(null)

provide('wrapperRef', wrapperRef)

useSeoMeta({
  title: ' ',
  description: 'The fullstack Nuxt 3',
})
</script>
