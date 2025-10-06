<template>
  <div v-if="user.banned" class="flex items-center gap-0.5">
    <span class="text-rose-500 text-xs">Yes</span>
    <UPopover mode="hover">
      <UButton variant="ghost" size="xs" color="error" icon="i-lucide-info" />
      <template #content>
        <div class="w-64 p-4">
          <p class="text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            Banned until
          </p>
          <p class="mt-1 text-sm">
            {{ formatDate(user.bannedUntil ?? undefined) }}
          </p>
          <p
            class="text-neutral-600 dark:text-neutral-400 mt-4 text-xs font-bold"
          >
            Reason
          </p>
          <p class="mt-1 text-sm">{{ user.bannedReason }}</p>
          <UButton
            label="Lift Ban"
            block
            variant="soft"
            color="orange"
            class="mt-4"
            :loading="loading"
            @click="$emit('liftBan', user)"
          />
        </div>
      </template>
    </UPopover>
  </div>
  <div v-else>No</div>
</template>

<script lang="ts" setup>
import { useDateFormat } from '@vueuse/core'
import type { User } from '@@/types/database'

defineProps<{
  user: User
  loading: boolean
}>()

defineEmits<(e: 'liftBan', user: User) => void>()

const formatDate = (date: string | Date | undefined) => {
  if (!date) return 'NA'
  return useDateFormat(date, 'MMM D, YYYY').value
}
</script>
