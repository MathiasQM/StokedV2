<script setup lang="ts">
definePageMeta({ layout: false })

// 1️⃣ Fetch portfolios as part of SSR
const { data: portfolios } = await useAsyncData('redirect-portfolios', () =>
  $fetch('/api/portfolios'),
)

// 2️⃣ Immediately redirect before hydration
if (import.meta.server) {
  const to = portfolios.value?.length ? '/dashboard' : '/market'
  navigateTo(to)
}

// 3️⃣ On client‐side nav (fallback)
if (import.meta.client) {
  const to = portfolios.value?.length ? '/dashboard' : '/market'
  navigateTo(to)
}
</script>

<template>
  <div class="flex h-screen w-screen flex-col items-center justify-center">
    <AppLogo />
  </div>
</template>
