<template>
  <NuxtRouteAnnouncer />
  <NuxtPwaManifest />
  <div class="md:hidden">
    <PwaInstallPrompt />
  </div>
  <div ref="wrapperRef" class="padding-env-top">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- MOVE TO LAYOUTS AS AUTH ROUTE ARE NOT AUTHENTICATED -->

    <!-- <AppPortfolioCountryProviderDropdown /> -->
    <AuthDrawer />
    <AppPortfolioSetupDrawer />
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
const wrapperRef = ref<HTMLElement | null>(null)

provide('wrapperRef', wrapperRef)

useSeoMeta({
  title: ' ',
  description: 'The fullstack Nuxt 3',
})
</script>
