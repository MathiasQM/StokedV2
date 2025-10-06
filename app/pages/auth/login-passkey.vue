<template>
  <main class="flex min-h-screen items-center justify-center">
    <div class="mx-auto w-full max-w-sm space-y-4">
      <img src="/logo.png" alt="logo" class="mx-auto h-10 w-auto" />
      <div class="text-center">
        <p class="text-lg font-bold">Sign in to your account</p>
        <p class="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
          Welcome back! Please sign in to continue.
        </p>
      </div>

      <!-- <UInput
          id="username"
          name="username"
          placeholder="Username"
          autocomplete="username webauthn"
          class="mb-4"
        /> -->
      <UButton
        :loading="loading"
        block
        color="orange"
        class="cursor-pointer mt-8"
        size="lg"
        icon="i-lucide-fingerprint"
        @click="handleManualLogin"
      >
        Sign in with Passkey
      </UButton>
      <USeparator label="OR" />
      <div class="grid grid-cols-1 gap-2">
        <AuthSocialLoginButton
          label="Google"
          icon="i-logos-google-icon"
          provider="google"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { z } from 'zod'
import { emailSchema } from '@@/shared/validations/auth'

definePageMeta({
  layout: false,
})

const { isSupported } = useWebAuthn()
const passkeysAreSupported = ref(true)
const toast = useToast()
const { fetch: refreshSession } = useUserSession()
const { authenticateWithPasskey } = usePasskeys()
const loading = ref(false)

type LoginSchema = z.output<typeof emailSchema>
const state = reactive<Partial<LoginSchema>>({
  email: undefined,
})

const handleLoginSuccess = async () => {
  await refreshSession()
  toast.add({
    title: 'Logged in successfully',
    color: 'success',
  })
  await navigateTo('/dashboard', { replace: true })
}

const handleManualLogin = async () => {
  loading.value = true
  const success = await authenticateWithPasskey()
  if (success) {
    await handleLoginSuccess()
  }
  loading.value = false
}

onMounted(async () => {
  passkeysAreSupported.value = isSupported.value
  loading.value = true
  if (!passkeysAreSupported.value) {
    return navigateTo('/auth/magic-link')
  }

  // const success = await authenticateWithPasskey()
  // if (success) {
  //   await handleLoginSuccess()
  // }
  loading.value = false
})
</script>
