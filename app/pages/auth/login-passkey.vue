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
      <p class="text-sm text-neutral-500">
        Don't have an account?
        <UButton to="/auth/register" variant="link" label="Sign up" />
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { startAuthentication } from '@simplewebauthn/browser'

definePageMeta({
  layout: false,
})

const { isSupported } = useWebAuthn()
const toast = useToast()
const { fetch: refreshSession } = useUserSession()
const loading = ref(false)

// This function will contain the new, two-step authentication logic.
const loginWithPasskey = async () => {
  loading.value = true
  try {
    // 1. Get authentication options from the server
    const options = await $fetch(
      '/api/auth/webauthn/generate-authentication-options',
      {
        method: 'POST',
      },
    )

    console.log('options', options)

    // 2. Prompt the user to authenticate with their passkey
    const assertion = await startAuthentication(options)

    console.log('assertion', assertion)

    // 3. Send the successful assertion to the server for verification
    await $fetch('/api/auth/webauthn/verify-authentication', {
      method: 'POST',
      body: assertion,
    })

    // If verification is successful, the user is logged in.
    return true
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.name === 'NotAllowedError') {
      toast.add({ title: 'Login cancelled', color: 'info' })
    } else {
      toast.add({
        title: 'Login Failed',
        description: error.data?.message || 'Could not sign in with passkey.',
        color: 'error',
      })
    }
    return false
  } finally {
    loading.value = false
  }
}

const handleLoginSuccess = async () => {
  await refreshSession()
  await navigateTo('/dashboard', { replace: true })
}

const handleManualLogin = async () => {
  if (!isSupported.value) {
    toast.add({
      title: 'Passkeys are not supported on this device.',
      color: 'error',
    })
    return
  }

  const success = await loginWithPasskey()
  if (success) {
    await handleLoginSuccess()
  }
}

onMounted(async () => {
  loading.value = true
  if (!isSupported.value) {
    return navigateTo('/auth/magic-link')
  }

  const success = await loginWithPasskey()
  if (success) {
    await handleLoginSuccess()
  }
  loading.value = false
})
</script>
