<template>
  <main class="relative flex min-h-screen items-center justify-center">
    <div class="mx-auto w-full max-w-sm space-y-4">
      <img src="/logo.png" alt="logo" class="mx-auto h-10 w-auto" />
      <div class="text-center">
        <p class="text-lg font-bold">Create your account</p>
        <p class="text-sm text-neutral-500">
          Already have an account?
          <UButton
            padding="none"
            trailing-icon="i-lucide-arrow-right"
            color="orange"
            to="/auth/login-passkey"
            variant="link"
            label="Sign In"
            class="font-normal"
          />
        </p>
      </div>
      <UForm
        :schema="emailSchema"
        :state="state"
        class="mt-8 space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            placeholder="you@example.com"
            class="w-full"
            size="lg"
            autocomplete="email"
          />
        </UFormField>

        <UButton
          type="submit"
          :loading="loading"
          block
          color="orange"
          class="cursor-pointer"
          size="lg"
          icon="i-lucide-fingerprint"
        >
          {{ isSupported ? 'Sign Up with Passkey' : 'Sign Up with Email' }}
        </UButton>
      </UForm>
      <!-- <USeparator label="OR" />
      <div class="grid grid-cols-2 gap-2">
        <AuthSocialLoginButton
          label="Google"
          icon="i-logos-google-icon"
          provider="google"
        />
      </div> -->
    </div>
  </main>
</template>

<script setup lang="ts">
import type { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
// We only need the email schema now
import { emailSchema } from '@@/shared/validations/auth'

definePageMeta({
  layout: false,
})

const { isSupported } = useWebAuthn()
const loading = ref(false)
// Get our new function from the composable
const { registerWithPasskey } = usePasskeys()
const { fetch: refreshSession } = useUserSession()

const state = reactive<{ email?: string }>({
  email: undefined,
})

// REWRITTEN SUBMIT HANDLER
async function onSubmit(event: FormSubmitEvent<z.output<typeof emailSchema>>) {
  loading.value = true
  try {
    if (!isSupported.value) {
      console.log('Passkeys not supported, implement magic link flow here.')
    }

    const success = await registerWithPasskey(event.data.email)

    if (success) {
      // On success, the session is already set by the server.
      // Refresh the client-side session state and navigate.
      await refreshSession()
      await navigateTo('/dashboard', { external: true }) // Redirect to the app
    }
  } finally {
    loading.value = false
  }
}
</script>
