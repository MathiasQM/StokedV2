<template>
  <NuxtRouteAnnouncer />
  <NuxtPwaManifest />
  <PwaInstallPrompt />
  <Toaster
    position="top-center"
    :toast-options="{
      classes: {
        toast:
          'group toast rounded-[16px] shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[3px] bg-[rgba(185,185,185,0.39)] dark:bg-[rgba(93,93,93,0.39)] border border-transparent dark:border-neutral-800',
        title: 'text-black dark:text-white',
        description: 'text-black/60 dark:text-white/60',
      },
    }"
    class="pt-[env(safe-area-inset-top)] absolute z-[9999]"
  />
  <div
    ref="wrapperRef"
    class="main-wrapper padding-env-top h-[calc(100vh-48px)] overflow-x-hidden overscroll-x-none"
  >
    <!-- <button
      @click="
        () => {
          toast({
            title: 'Scheduled: Catch up',
            description: 'Friday, February 10, 2023 at 5:57 PM',
          })
        }
      "
    >
      test
    </button> -->

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- MOVE TO LAYOUTS AS AUTH ROUTE ARE NOT AUTHENTICATED -->
    <!-- <AppPopupsChoosePortfolios  /> -->

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
import Toaster from './components/ui/toast/Toaster.vue'
import { useToast } from '@/components/ui/toast/use-toast'

const wrapperRef = ref<HTMLElement | null>(null)

provide('wrapperRef', wrapperRef)

useSeoMeta({
  title: ' ',
  description: 'The fullstack Nuxt 3',
})
</script>
