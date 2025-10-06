<script setup>
definePageMeta({
  middleware: [],
  layout: false,
})
</script>
<template>
  <UContainer class="space-y-4 py-12">
    <NuxtLink class="block hover:underline" to="/auth/login">
      Login (Email/Password)
    </NuxtLink>
    <NuxtLink class="block hover:underline" to="/auth/magic-link">
      Login (Magic Link)
    </NuxtLink>
    <NuxtLink class="block hover:underline" to="/auth/login-passkey">
      Login (Passkey)
    </NuxtLink>
    <NuxtLink class="block hover:underline" to="/auth/social-login">
      Social Login
    </NuxtLink>
    <NuxtLink class="block hover:underline" to="/auth/login-phone">
      Phone Number Login
    </NuxtLink>
    <NuxtLink class="block hover:underline" to="/auth/social-login">
      Social Login
    </NuxtLink>
    <NuxtLink class="block hover:underline" to="/auth/register">
      Register
    </NuxtLink>
    <NuxtLink class="block hover:underline" to="/dashboard">
      Dashboard
    </NuxtLink>
  </UContainer>
</template>
