<script setup lang="ts">
import { usePortfolioRealtime } from '@/composables/portfolio/usePortfolioRealtime'
import { convertAndFormatCurrency } from '@/utils/numbers'

const { user } = useUserSession()
const { totalMarketValue } = usePortfolioRealtime()

const convertedTotalMarketValue: Ref<string | null> = ref(null)

watchEffect(async () => {
  if (!totalMarketValue.value || !user.value) return

  convertedTotalMarketValue.value = await convertAndFormatCurrency(
    totalMarketValue.value,
    'USD',
    user.value.currency ?? 'USD',
    user.value.country ?? 'US',
    0,
  )
})
</script>

<template>
  <div class="space-y-2 text-start">
    <p class="text-black-50 mb-2 text-2xl font-semibold tracking-wide">
      {{ convertedTotalMarketValue }}
    </p>
  </div>
</template>
