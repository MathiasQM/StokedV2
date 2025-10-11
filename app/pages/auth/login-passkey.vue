<template>
  <main class="flex min-h-screen items-center justify-center p-5">
    <div
      v-if="isRedirecting"
      class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80"
    >
      <div class="text-center">
        <UButton color="orange" loading size="xl" variant="soft" />
        <p class="mt-4 text-sm font-medium">Setting up your account...</p>
      </div>
    </div>
    <div class="mx-auto w-full max-w-sm space-y-4">
      <img src="/logo.png" alt="logo" class="mx-auto h-10 w-auto" />
      <div class="text-center">
        <p class="text-lg font-bold">Sign in to your account</p>
        <p class="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
          Welcome back! Please sign in to continue.
        </p>
      </div>

      <UButton
        :loading="authenticating"
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
definePageMeta({
  layout: false,
})

const isRedirecting = ref(false)
const { isSupported } = useWebAuthn()
const toast = useToast()
const { fetch: refreshSession, loggedIn } = useUserSession()

const { signInWithPasskey, authenticating } = usePasskeys()

const handleLoginSuccess = async () => {
  isRedirecting.value = true
  await refreshSession()
  await navigateTo('/dashboard', { replace: true })
}

const handleManualLogin = async () => {
  if (!isSupported.value) {
    toast.add({
      title: 'Not Supported',
      description: 'Passkeys are not supported on this browser or device.',
      color: 'error',
    })
    return
  }

  const success = await signInWithPasskey()
  if (success) {
    await handleLoginSuccess()
  }
}

onMounted(async () => {
  if (loggedIn.value) {
    return navigateTo('/dashboard')
  }

  if (!isSupported.value) {
    return navigateTo('/auth/magic-link')
  }

  const success = await signInWithPasskey(true)
  if (success) {
    await handleLoginSuccess()
  }
})
</script>
