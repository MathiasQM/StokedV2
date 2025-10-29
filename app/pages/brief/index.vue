<template>
  <main class="flex overflow-hidden">
    <div class="w-full min-w-0 flex-1 overflow-y-auto">
      <SuperAdminImpersonationBanner v-if="user?._impersonated" :user="user" />
      <AppContainer :title="`Dashboard`">
        <AppBriefGreeting :name="user.name" />
        <p>
          Your portfolio is up 7% today, largely due to news that Nvidia is
          ramping up production. Things to look out for today are upcoming
          earnings from TSLA and MSFT

          <br />
          Listen to your daily breif now or get your overview down below
        </p>
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
</script>
