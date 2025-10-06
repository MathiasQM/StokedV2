<template>
  <div
    class="border-white/10 bg-black text-white dark:border-neutral-700 dark:bg-neutral-300 dark:text-neutral-950 fixed bottom-24 z-40 flex h-14 w-full animate-pulse items-center justify-between border-b px-4 text-sm md:sticky md:top-0 md:h-8"
  >
    <div class="flex-col items-center gap-2 md:flex">
      Impersonating
      <div class="flex items-center gap-2">
        <UAvatar :src="user?.avatarUrl" size="3xs" :alt="user?.name" />
        <span class="font-bold"> {{ user?.email }} </span>
      </div>
      Proceed with caution.
    </div>
    <UButton
      @click="stopImpersonation()"
      size="xs"
      color="orange"
      label="Stop session"
    />
  </div>
</template>

<script lang="ts" setup>
import type { User } from '@@/types/database'
const props = defineProps<{
  user: User
}>()
const { fetch: refreshUserSession } = useUserSession()
const stopImpersonation = async () => {
  await $fetch('/api/super-admin/users/stop-impersonation', {
    method: 'POST',
    body: {
      userId: props.user.id,
    },
  })
  await refreshUserSession()
  window.location.href = '/dashboard/super-admin'
}
</script>
