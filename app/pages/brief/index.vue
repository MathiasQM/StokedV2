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

const modal = useGlobalDrawerDialogStore()

function openModal() {
  modal.openModal({
    mode: 'drawer',
    title: '',
    description: '',
    componentName: 'MediaController',
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
