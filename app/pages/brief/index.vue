<template>
  <main class="flex overflow-hidden">
    <div class="w-full min-w-0 flex-1 overflow-y-auto">
      <SuperAdminImpersonationBanner v-if="user?._impersonated" :user="user" />
      <AppContainer :title="`Dashboard`">
        <AppBriefGreeting :name="user?.name" />
        <p class="mb-6 text-sm text-gray-700 dark:text-gray-300">
          {{ briefData?.summaryData ?? 'No brief for this day yet.' }}
        </p>
        <Button v-if="!showBriefNavElement" @click="openModal" variant="outline"
          >Play todays brief</Button
        >
        <AppBriefCalendarRow
          class="no-swipe"
          v-model="selectedDate"
          dateFormat="d"
          disable-future
        />
      </AppContainer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useBrief } from '~~/stores/brief'
import { useGlobalDrawerDialogStore } from '~~/stores/globalDrawerDialog'

const briefStore = useBrief()
const { briefData, pending, playing, showBriefNavElement } =
  storeToRefs(briefStore)
const { user } = useUserSession()
const { $dayjs } = useNuxtApp()
const selectedDate = ref($dayjs())

watch(selectedDate, (newDate) => {
  briefStore.setDate(newDate.format('YYYY-MM-DD'))
})

definePageMeta({
  key: 'brief',
})

onMounted(() => {
  // 1. Guard against SSR (Server Side Rendering) just in case, though onMounted usually handles this.
  if (typeof window === 'undefined') return

  // 2. Define context safely (with TS handling for webkit prefix)
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext

  // 3. If the browser supports it, initialize
  if (AudioContext) {
    const audioCtx = new AudioContext()

    const unlockAudio = () => {
      // Only resume if it's suspended (which it usually is on iOS PWA launch)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
          console.log('🔊 iOS AudioContext unlocked/resumed')
        })
      }

      // Clean up listeners so we don't spam the logic
      document.removeEventListener('touchstart', unlockAudio)
      document.removeEventListener('click', unlockAudio)
    }

    // Listen for the very first interaction
    document.addEventListener('touchstart', unlockAudio, { once: true })
    document.addEventListener('click', unlockAudio, { once: true })
  }
})

const modal = useGlobalDrawerDialogStore()

function openModal() {
  modal.openModal({
    mode: 'drawer',
    title: '',
    description: '',
    componentName: 'BriefStage',
    componentProps: { buttonText: 'Send Invite' },
    footerText:
      'Remember, this is not financial advice. Always pair your choices with a healthy dose of skepticism and your own research.',
    actions: [],
    backdropClose: true,
    escClose: true,
  })
  playing.value = true
  showBriefNavElement.value = true
}
</script>
