<template>
  <div class="space-y-4">
    <div
      v-if="isRedirecting"
      class="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
    >
      <div class="text-center">
        <UButton color="orange" loading size="xl" variant="soft" />
        <p class="mt-4 text-sm font-medium">Signing in...</p>
      </div>
    </div>

    <UButton
      :loading="authenticating"
      block
      size="lg"
      :icon="
        !authenticating ? 'i-lucide-fingerprint' : 'i-lucide-loader-circle'
      "
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

    <p class="pt-2 text-center text-sm text-neutral-500">
      No account yet?
      <UButton
        variant="link"
        class="p-0"
        @click="authStore.setView('register')"
      >
        Sign up
      </UButton>
    </p>

    <p class="text-center text-sm text-neutral-500">
      Can't use passkey?
      <UButton
        variant="link"
        class="p-0"
        @click="authStore.setView('magic-link')"
      >
        Use a magic link
      </UButton>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthModal } from '~~/stores/authModal'

const emit = defineEmits(['success'])
const authStore = useAuthModal()

const { isSupported } = useWebAuthn()
const toast = useToast()
const { fetch: refreshSession } = useUserSession()
const { signInWithPasskey, authenticating } = usePasskeys()
const isRedirecting = ref(false)

async function handleLoginSuccess() {
  isRedirecting.value = true
  await refreshSession()
  emit('success')
}

async function handleManualLogin() {
  if (!isSupported.value) {
    toast.add({
      title: 'Not Supported',
      description: 'Passkeys are not supported on this browser.',
      color: 'error',
    })
    return
  }

  const success = await signInWithPasskey()
  if (success) {
    await handleLoginSuccess()
  }
}
</script>
