<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-medium">General settings</h3>
        <!-- <UButton
          label="Link Account"
          variant="subtle"
          color="orange"
          @click="linkAccountModal = true"
        /> -->
      </div>
      <p class="text-neutral-500 mt-1 text-sm">Your general account setup</p>
    </template>
    <div class="divide-neutral-200 dark:divide-white/10 divide-y">
      <Item class="px-0">
        <ItemContent>
          <ItemTitle>Currency</ItemTitle>
          <ItemDescription>How your currency is displayed</ItemDescription>
        </ItemContent>
        <ItemActions>
          <AppAccountSettingsOptionsSelect
            :options="supportedCurrencies"
            :selected="state.currency"
            @update:selected="handleUpdate"
          />
        </ItemActions>
      </Item>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemActions,
  ItemTitle,
} from '@/components/ui/item'
import { COUNTRY_TO_CURRENCY } from '~~/server/utils/request-geo'
import _ from 'lodash'

const { user } = useUserSession()
const { updateUser, loading, schema } = useUserAccount()

const supportedCurrencies = _.uniq(Object.values(COUNTRY_TO_CURRENCY))
const state = ref({
  currency: user.value?.currency ?? 'EUR',
})
const handleUpdate = async (newCurrency: string) => {
  if (!newCurrency || newCurrency === state.value.currency) return
  const prev = state.value.currency
  state.value.currency = newCurrency
  try {
    await updateUser({ currency: newCurrency })
  } catch {
    state.value.currency = prev
  }
}
</script>
