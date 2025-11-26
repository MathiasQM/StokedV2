<template>
  <div>
    <AppLayouts>
      <AppPopupsChoosePortfolios />

      <slot />
    </AppLayouts>
  </div>
</template>

<script setup lang="ts">
await getExchangeRates()
</script>
