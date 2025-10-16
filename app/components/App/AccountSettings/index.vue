<template>
  <div class="space-y-8">
    <div class="flex w-full flex-wrap gap-5">
      <AppAccountSettingsPersonalInfo />
      <!-- <AppAccountSettingsPhoneNumber /> -->
    </div>
    <AppAccountSettingsGeneral />
    <UButton
      size="xl"
      variant="solid"
      class="w-full text-white bg-neutral-900 border border-neutral-800"
      @click="signOut()"
      >Log out</UButton
    >
  </div>
</template>

<script setup lang="ts">
const { logout } = useAuth()

async function signOut() {
  await logout()
  await navigateTo('/')
}
</script>
