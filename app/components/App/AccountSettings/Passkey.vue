<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-medium">Passkey Manager</h2>
          <UButton
            size="lg"
            color="orange"
            :loading="creating"
            :disabled="creating"
            @click="modal = true"
          >
            Add Passkey
          </UButton>
        </div>
        <p class="text-neutral-500 mt-1 text-sm">
          Add and manage your passkeys here
        </p>
      </template>
      <div v-if="status === 'pending'" class="flex items-center justify-center">
        <UIcon name="i-lucide-loader" class="animate-spin" />
      </div>
      <div v-else-if="status === 'success'">
        <div
          v-if="passkeys && passkeys.length === 0"
          class="bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-4 rounded p-4 text-sm"
        >
          <UIcon name="i-lucide-fingerprint" class="h-6 w-6" />
          <p>No fingerprints or face IDs linked to your account.</p>
        </div>
        <ul class="divide-neutral-100 dark:divide-neutral-800 divide-y">
          <li
            v-for="passkey in passkeys"
            :key="passkey.id"
            class="flex items-center justify-between py-4"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-fingerprint" class="h-6 w-6" />
              {{ passkey.name }}
              <Badge
                variant="secondary"
                :class="
                  passkey.revokedAt
                    ? 'bg-red-500/20 text-red-500'
                    : 'bg-green-500/20 text-green-500'
                "
                size="sm"
              >
                {{ passkey.revokedAt === null ? 'Active' : 'Revoked' }}
              </Badge>
            </div>
            <UButton
              v-if="!passkey.revokedAt"
              class="bg-red-500/20 text-red-500 hover:bg-red-500/30 disabled:hover:bg-red-500/30"
              variant="soft"
              icon="i-ph-trash"
              :loading="deleting === passkey.id"
              :disabled="activePasskeyCount <= 1 || deleting === passkey.id"
              @click="revokePasskey(passkey.id)"
            >
              Revoke
            </UButton>
            <UButton
              v-else
              color="orange"
              variant="soft"
              icon="i-ph-trash"
              :loading="deleting === passkey.id"
              :disabled="deleting === passkey.id"
              @click="invokePasskey(passkey.id)"
            >
              Invoke
            </UButton>
          </li>
        </ul>
      </div>
    </UCard>
    <UDrawer
      v-model:open="modal"
      title="Register a new passkey"
      :ui="{ container: 'max-w-xl mx-auto' }"
    >
      <template #body>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="handleCreatePasskey"
        >
          <UFormField label="Name" name="name" size="lg">
            <UInput
              v-model="state.name"
              placeholder="Example: My MacBook"
              class="w-full"
              size="lg"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="creating"
            :disabled="creating"
            label="Create Passkey"
            block
            size="lg"
            color="orange"
          />
        </UForm>
      </template>
    </UDrawer>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { Badge } from '@/components/ui/badge'

const modal = ref(false)
const {
  passkeys,
  status,
  creating,
  deleting,
  createPasskey,
  revokePasskey,
  invokePasskey,
} = usePasskeys()

const { user } = useUserSession()
const schema = z.object({
  name: z.string().min(1).max(255),
})
const state = reactive({
  name: undefined,
})

type Schema = z.output<typeof schema>

const activePasskeyCount = computed(() => {
  if (!passkeys.value) return 0
  return passkeys.value.filter((p) => !p.revokedAt).length
})

async function handleCreatePasskey(event: FormSubmitEvent<Schema>) {
  if (!user.value) return
  const success = await createPasskey(user.value.email, event.data.name)
  if (success) {
    modal.value = false
    state.name = undefined
  }
}
</script>
