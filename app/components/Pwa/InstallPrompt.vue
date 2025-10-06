<template>
  <Drawer v-if="isStandalone !== undefined && !isStandalone">
    <DrawerTrigger as-child>
      <Button variant="default"
        class="flex aspect-square h-6 w-6 cursor-pointer ring-2 ring-gray-200 bg-gray-100 items-center rounded-full md:w-auto p-0 hover:bg-zinc-200/80  md:rounded-md md:px-3 md:py-4 dark:bg-white/8 dark:hover:bg-white/10">
        <Icon name="i-lucide-download" class="text-xs text-orange-500 md:text-md dark:text-white md:text-black" />

        <span class="hidden md:block text-black dark:text-white text-xs">Install app</span>
      </Button>
    </DrawerTrigger>
    <DrawerContent class="mb-5 p-4 md:p-6">
      <div class="mx-auto w-full max-w-md space-y-6">
        <!-- Header -->
        <DrawerHeader>
          <DrawerTitle class="text-center text-2xl font-semibold">
            Install <span class="text-orange-500">{{ pwaName }}</span>
          </DrawerTitle>
          <DrawerDescription class="text-center text-gray-600 dark:text-white">
            {{ pwaDescription }}
          </DrawerDescription>
        </DrawerHeader>

        <!-- Gallery Slider -->
        <div class="mx-auto w-full max-w-md min-h-52 relative">
          <Carousel class="absolute" snap="center" loop>
            <CarouselContent>
              <CarouselItem v-for="(src, idx) in screenshots" :key="idx" class="flex justify-center">
                <img :src="src" alt="App screenshot" class="fade-out-mask select-none" :class="smallerThanMd
                  ? 'h-auto w-1/2 rounded-lg object-cover'
                  : 'h-full w-full rounded-lg object-cover'
                  " />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>


        <!-- Installation Steps -->
        <div class="space-y-4 px-5">
          <h3 class="text-lg font-semibold">
            How to install on {{ platformName }}
          </h3>
          <ol class="list-decimal space-y-2 text-black-700 dark:text-white text-sm">
            <li v-for="(step, i) in installSteps" :key="i" class="flex items-center gap-3 text-md">
              <span v-if="step.icon" class="p-1 bg-gray-200 dark:bg-black-800 rounded-sm flex">
                <Icon :name="step.icon" class="h-4 w-4" />
              </span>
              <span>{{ step.text }}</span>
            </li>
          </ol>
        </div>
        <!-- Footer -->
        <DrawerFooter class="justify-center space-y-2">
          <Button v-if="canInstall" @click="promptInstall" class="w-full bg-orange-500 text-white">
            Install Now
          </Button>
          <DrawerClose as-child>
            <Button variant="outline" class="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

const breakpoints = useBreakpoints(breakpointsTailwind)
const smallerThanMd = breakpoints.smaller('md')
const { $pwa } = useNuxtApp()
const isStandalone = ref<boolean | undefined>(undefined)
const deferredPrompt = ref<any>(null)
const canInstall = ref(false)

// PWA Info
const pwaName = 'Striive'
const pwaDescription = 'Available on all your devices!'

// Reactive screenshots array, populated client‑side
const screenshots = ref<string[]>([])

// Platform name & install steps (reactive)
const platformName = ref('Your device')
const installSteps = ref<{ text: string, icon: string }[]>([{
  text: 'Look for the install option in your browser menu',
  icon: '',
}])
const isMobile = ref(false)

onMounted(() => {
  // ─── Detect device & choose screenshots ────────────────────────────────
  const ua = navigator.userAgent.toLowerCase()
  isMobile.value =
    /android|iphone|ipad|ipod|windows phone|blackberry|bb|mobile/i.test(ua)

  const mobileImages = import.meta.glob('@@/public/screenshots/mobile/*.{png,jpg,jpeg}', {
    eager: true,
    import: 'default',
    query: '?url',
  });
  const desktopImages = import.meta.glob('@@/public/screenshots/desktop/*.{png,jpg,jpeg}', {
    eager: true,
    import: 'default',
    query: '?url',
  });

  const modules = smallerThanMd.value ? mobileImages : desktopImages;

  const filtered = Object.entries(modules)
    .map(([, url]) => url as string)

  screenshots.value = filtered.length
    ? filtered
    : (Object.values(modules) as string[])

  // ─── Set platform‑specific instructions ───────────────────────────────
  if (/macintosh/.test(ua)) {
    if (/safari/.test(ua) && !/chrome/.test(ua)) {
      platformName.value = 'macOS Safari'
      installSteps.value = [
        { text: 'Click the Share icon in the toolbar', icon: 'i-lucide-share' },
        { text: "Select 'Add to dock'", icon: 'i-lucide-dock' },
        { text: 'Confirm by clicking Add', icon: 'i-lucide-circle-check' },
      ]
    } else if (/chrome/.test(ua)) {
      platformName.value = 'macOS Chrome'
      installSteps.value = [
        { text: 'Click the install icon in the address bar', icon: 'i-lucide-monitor-down' },
        { text: 'Confirm by clicking Install', icon: 'i-lucide-circle-check' },
      ]
    }
  } else if (/iphone|ipad/.test(ua)) {
    platformName.value = 'iOS'
    installSteps.value = [
      { text: 'Tap the Share button in Safari', icon: 'i-lucide-share' },
      { text: "Select 'Add to Home Screen'", icon: 'i-lucide-square-plus' },
      { text: 'Confirm by tapping Add', icon: 'i-lucide-circle-check' },
    ]
  } else if (/android/.test(ua)) {
    platformName.value = 'Android'
    installSteps.value = [
      { text: 'Tap the menu icon (three dots)', icon: 'i-lucide-ellipsis-vertical' },
      { text: "Select 'Add to Home screen'", icon: 'i-lucide-square-plus' },
      { text: 'Tap Add', icon: 'i-lucide-circle-check' },
    ]
  } else if (/windows/.test(ua)) {
    platformName.value = 'Windows'
    installSteps.value = [
      { text: 'Click the install icon in the address bar', icon: 'i-lucide-monitor-down' },
      { text: "Confirm by clicking Install", icon: 'i-lucide-circle-check' },

    ]
  } else {
    platformName.value = 'Your browser'
    installSteps.value = [
      { text: 'Look for the install option in your browser menu', icon: 'i-lucide-add' },
      { text: 'Follow the on‑screen prompts', icon: 'i-lucide-circle-check' },
    ]
  }

  // ─── Standalone / install prompt detection ───────────────────────────
  const matchDisplayMode = window.matchMedia?.('(display-mode: standalone)').matches
  const legacyiOS = (window.navigator as any)?.standalone === true
  const fromPwaPlugin = $pwa?.isPWAInstalled === true

  isStandalone.value = matchDisplayMode || legacyiOS || fromPwaPlugin

  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault()
    if (typeof e.prompt === 'function') {
      deferredPrompt.value = e
      if ($pwa?.swActivated) {
        canInstall.value = true
      }
    }
  })
})

function promptInstall() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    deferredPrompt.value.userChoice.finally(() => {
      deferredPrompt.value = null
    })
  } else if ($pwa?.showInstallPrompt) {
    $pwa!.install()
  }
}
</script>
