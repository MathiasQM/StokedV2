<template>
  <main class="flex overflow-hidden">
    <div class="w-full min-w-0 flex-1 overflow-y-auto">
      <SuperAdminImpersonationBanner v-if="user?._impersonated" :user="user" />
      <AppContainer :title="`Dashboard`">
        <AppBriefGreeting :name="user?.name" />
        <p
          v-if="!pending"
          class="mb-6 text-sm text-gray-700 dark:text-gray-300"
        >
          {{ briefData?.summaryData ?? 'No brief for this day yet.' }}
        </p>
        <audio
          v-if="!pending && briefData?.audioUrl"
          :src="briefData.audioUrl"
          controls
          class="mb-6 w-full"
        ></audio>
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
const { user } = useUserSession()
const { $dayjs } = useNuxtApp()
const selectedDate = ref($dayjs())

const {
  data: briefData,
  pending,
  refresh,
} = useAsyncData(
  () => `brief:${selectedDate.value.format('YYYY-MM-DD')}`,
  () =>
    $fetch('/api/brief', {
      method: 'POST',
      body: { date: selectedDate.value.startOf('day').toISOString() },
    }),
  { watch: [selectedDate] },
)
</script>
