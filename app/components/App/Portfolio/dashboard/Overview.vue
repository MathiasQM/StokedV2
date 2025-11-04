<template>
  <div class="flex flex-col gap-3">
    <CustomCard
      enableBorderFlare
      class="group w-full flex-1 select-none min-w-[325px]"
    >
      <WidgetsPortfolioValue class="px-5" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})
</script>
