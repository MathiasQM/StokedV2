<template>
  <main class="flex min-h-screen items-center justify-center">
    <div class="mx-auto w-full max-w-sm space-y-2">
      <UButton
        to="/auth/login"
        block
        color="orange"
        size="lg"
        icon="i-lucide-lock"
        variant="subtle"
      >
        Email Password
      </UButton>
      <UButton
        to="/auth/magic-link"
        block
        color="orange"
        size="lg"
        icon="i-lucide-link"
        variant="subtle"
      >
        Magic Link
      </UButton>
      <UButton
        to="/auth/login-passkey"
        block
        color="orange"
        size="lg"
        icon="i-lucide-fingerprint"
        variant="subtle"
      >
        Passkey
      </UButton>
      <UButton
        to="/auth/login-phone"
        block
        color="orange"
        size="lg"
        icon="i-lucide-phone"
        variant="subtle"
      >
        Phone
      </UButton>
      <AuthSocialLoginButton
        label="Google"
        icon="i-logos-google-icon"
        provider="google"
      />
      <AuthSocialLoginButton
        label="Github"
        icon="i-mdi-github"
        provider="github"
      />
      <AuthSocialLoginButton
        label="Discord"
        icon="i-logos-discord-icon"
        provider="discord"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})
</script>
