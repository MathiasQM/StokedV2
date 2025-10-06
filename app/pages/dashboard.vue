<template>
  <main class="flex overflow-hidden">
    <div class="w-full min-w-0 flex-1 overflow-y-auto">
      <SuperAdminImpersonationBanner v-if="user?._impersonated" :user="user" />
      <NuxtPage />
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { user } = useUserSession()
</script>
