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
          <ItemTitle>Default portfolio</ItemTitle>
          <ItemDescription> Your default portfolio </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Select>
            <SelectTrigger :disabled="true" class="w-[130px]">
              <SelectValue placeholder="Select a currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="est">
                  Eastern Standard Time (EST)
                </SelectItem>
                <SelectItem value="cst">
                  Central Standard Time (CST)
                </SelectItem>
                <SelectItem value="mst">
                  Mountain Standard Time (MST)
                </SelectItem>
                <SelectItem value="pst">
                  Pacific Standard Time (PST)
                </SelectItem>
                <SelectItem value="akst">
                  Alaska Standard Time (AKST)
                </SelectItem>
                <SelectItem value="hst">
                  Hawaii Standard Time (HST)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Europe & Africa</SelectLabel>
                <SelectItem value="gmt"> Greenwich Mean Time (GMT) </SelectItem>
                <SelectItem value="cet">
                  Central European Time (CET)
                </SelectItem>
                <SelectItem value="eet">
                  Eastern European Time (EET)
                </SelectItem>
                <SelectItem value="west">
                  Western European Summer Time (WEST)
                </SelectItem>
                <SelectItem value="cat"> Central Africa Time (CAT) </SelectItem>
                <SelectItem value="eat"> East Africa Time (EAT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Asia</SelectLabel>
                <SelectItem value="msk"> Moscow Time (MSK) </SelectItem>
                <SelectItem value="ist"> India Standard Time (IST) </SelectItem>
                <SelectItem value="cst_china">
                  China Standard Time (CST)
                </SelectItem>
                <SelectItem value="jst"> Japan Standard Time (JST) </SelectItem>
                <SelectItem value="kst"> Korea Standard Time (KST) </SelectItem>
                <SelectItem value="ist_indonesia">
                  Indonesia Central Standard Time (WITA)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Australia & Pacific</SelectLabel>
                <SelectItem value="awst">
                  Australian Western Standard Time (AWST)
                </SelectItem>
                <SelectItem value="acst">
                  Australian Central Standard Time (ACST)
                </SelectItem>
                <SelectItem value="aest">
                  Australian Eastern Standard Time (AEST)
                </SelectItem>
                <SelectItem value="nzst">
                  New Zealand Standard Time (NZST)
                </SelectItem>
                <SelectItem value="fjt"> Fiji Time (FJT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>South America</SelectLabel>
                <SelectItem value="art"> Argentina Time (ART) </SelectItem>
                <SelectItem value="bot"> Bolivia Time (BOT) </SelectItem>
                <SelectItem value="brt"> Brasilia Time (BRT) </SelectItem>
                <SelectItem value="clt"> Chile Standard Time (CLT) </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </ItemActions>
      </Item>
      <Item class="px-0">
        <ItemContent>
          <ItemTitle>Country</ItemTitle>
          <ItemDescription> Your country of residency </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Select>
            <SelectTrigger class="w-[130px]">
              <SelectValue placeholder="Select a currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="est">
                  Eastern Standard Time (EST)
                </SelectItem>
                <SelectItem value="cst">
                  Central Standard Time (CST)
                </SelectItem>
                <SelectItem value="mst">
                  Mountain Standard Time (MST)
                </SelectItem>
                <SelectItem value="pst">
                  Pacific Standard Time (PST)
                </SelectItem>
                <SelectItem value="akst">
                  Alaska Standard Time (AKST)
                </SelectItem>
                <SelectItem value="hst">
                  Hawaii Standard Time (HST)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Europe & Africa</SelectLabel>
                <SelectItem value="gmt"> Greenwich Mean Time (GMT) </SelectItem>
                <SelectItem value="cet">
                  Central European Time (CET)
                </SelectItem>
                <SelectItem value="eet">
                  Eastern European Time (EET)
                </SelectItem>
                <SelectItem value="west">
                  Western European Summer Time (WEST)
                </SelectItem>
                <SelectItem value="cat"> Central Africa Time (CAT) </SelectItem>
                <SelectItem value="eat"> East Africa Time (EAT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Asia</SelectLabel>
                <SelectItem value="msk"> Moscow Time (MSK) </SelectItem>
                <SelectItem value="ist"> India Standard Time (IST) </SelectItem>
                <SelectItem value="cst_china">
                  China Standard Time (CST)
                </SelectItem>
                <SelectItem value="jst"> Japan Standard Time (JST) </SelectItem>
                <SelectItem value="kst"> Korea Standard Time (KST) </SelectItem>
                <SelectItem value="ist_indonesia">
                  Indonesia Central Standard Time (WITA)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Australia & Pacific</SelectLabel>
                <SelectItem value="awst">
                  Australian Western Standard Time (AWST)
                </SelectItem>
                <SelectItem value="acst">
                  Australian Central Standard Time (ACST)
                </SelectItem>
                <SelectItem value="aest">
                  Australian Eastern Standard Time (AEST)
                </SelectItem>
                <SelectItem value="nzst">
                  New Zealand Standard Time (NZST)
                </SelectItem>
                <SelectItem value="fjt"> Fiji Time (FJT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>South America</SelectLabel>
                <SelectItem value="art"> Argentina Time (ART) </SelectItem>
                <SelectItem value="bot"> Bolivia Time (BOT) </SelectItem>
                <SelectItem value="brt"> Brasilia Time (BRT) </SelectItem>
                <SelectItem value="clt"> Chile Standard Time (CLT) </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </ItemActions>
      </Item>
      <Item class="px-0">
        <ItemContent>
          <ItemTitle>Currency</ItemTitle>
          <ItemDescription>How your currency is displayed</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Select>
            <SelectTrigger class="w-[130px]">
              <SelectValue placeholder="Select a currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="est">
                  Eastern Standard Time (EST)
                </SelectItem>
                <SelectItem value="cst">
                  Central Standard Time (CST)
                </SelectItem>
                <SelectItem value="mst">
                  Mountain Standard Time (MST)
                </SelectItem>
                <SelectItem value="pst">
                  Pacific Standard Time (PST)
                </SelectItem>
                <SelectItem value="akst">
                  Alaska Standard Time (AKST)
                </SelectItem>
                <SelectItem value="hst">
                  Hawaii Standard Time (HST)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Europe & Africa</SelectLabel>
                <SelectItem value="gmt"> Greenwich Mean Time (GMT) </SelectItem>
                <SelectItem value="cet">
                  Central European Time (CET)
                </SelectItem>
                <SelectItem value="eet">
                  Eastern European Time (EET)
                </SelectItem>
                <SelectItem value="west">
                  Western European Summer Time (WEST)
                </SelectItem>
                <SelectItem value="cat"> Central Africa Time (CAT) </SelectItem>
                <SelectItem value="eat"> East Africa Time (EAT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Asia</SelectLabel>
                <SelectItem value="msk"> Moscow Time (MSK) </SelectItem>
                <SelectItem value="ist"> India Standard Time (IST) </SelectItem>
                <SelectItem value="cst_china">
                  China Standard Time (CST)
                </SelectItem>
                <SelectItem value="jst"> Japan Standard Time (JST) </SelectItem>
                <SelectItem value="kst"> Korea Standard Time (KST) </SelectItem>
                <SelectItem value="ist_indonesia">
                  Indonesia Central Standard Time (WITA)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Australia & Pacific</SelectLabel>
                <SelectItem value="awst">
                  Australian Western Standard Time (AWST)
                </SelectItem>
                <SelectItem value="acst">
                  Australian Central Standard Time (ACST)
                </SelectItem>
                <SelectItem value="aest">
                  Australian Eastern Standard Time (AEST)
                </SelectItem>
                <SelectItem value="nzst">
                  New Zealand Standard Time (NZST)
                </SelectItem>
                <SelectItem value="fjt"> Fiji Time (FJT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>South America</SelectLabel>
                <SelectItem value="art"> Argentina Time (ART) </SelectItem>
                <SelectItem value="bot"> Bolivia Time (BOT) </SelectItem>
                <SelectItem value="brt"> Brasilia Time (BRT) </SelectItem>
                <SelectItem value="clt"> Chile Standard Time (CLT) </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </ItemActions>
      </Item>
      <Item class="px-0">
        <ItemContent>
          <ItemTitle>Timezone</ItemTitle>
          <ItemDescription> Your timezone </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Select>
            <SelectTrigger class="w-[130px]">
              <SelectValue placeholder="Select a currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="est">
                  Eastern Standard Time (EST)
                </SelectItem>
                <SelectItem value="cst">
                  Central Standard Time (CST)
                </SelectItem>
                <SelectItem value="mst">
                  Mountain Standard Time (MST)
                </SelectItem>
                <SelectItem value="pst">
                  Pacific Standard Time (PST)
                </SelectItem>
                <SelectItem value="akst">
                  Alaska Standard Time (AKST)
                </SelectItem>
                <SelectItem value="hst">
                  Hawaii Standard Time (HST)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Europe & Africa</SelectLabel>
                <SelectItem value="gmt"> Greenwich Mean Time (GMT) </SelectItem>
                <SelectItem value="cet">
                  Central European Time (CET)
                </SelectItem>
                <SelectItem value="eet">
                  Eastern European Time (EET)
                </SelectItem>
                <SelectItem value="west">
                  Western European Summer Time (WEST)
                </SelectItem>
                <SelectItem value="cat"> Central Africa Time (CAT) </SelectItem>
                <SelectItem value="eat"> East Africa Time (EAT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Asia</SelectLabel>
                <SelectItem value="msk"> Moscow Time (MSK) </SelectItem>
                <SelectItem value="ist"> India Standard Time (IST) </SelectItem>
                <SelectItem value="cst_china">
                  China Standard Time (CST)
                </SelectItem>
                <SelectItem value="jst"> Japan Standard Time (JST) </SelectItem>
                <SelectItem value="kst"> Korea Standard Time (KST) </SelectItem>
                <SelectItem value="ist_indonesia">
                  Indonesia Central Standard Time (WITA)
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Australia & Pacific</SelectLabel>
                <SelectItem value="awst">
                  Australian Western Standard Time (AWST)
                </SelectItem>
                <SelectItem value="acst">
                  Australian Central Standard Time (ACST)
                </SelectItem>
                <SelectItem value="aest">
                  Australian Eastern Standard Time (AEST)
                </SelectItem>
                <SelectItem value="nzst">
                  New Zealand Standard Time (NZST)
                </SelectItem>
                <SelectItem value="fjt"> Fiji Time (FJT) </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>South America</SelectLabel>
                <SelectItem value="art"> Argentina Time (ART) </SelectItem>
                <SelectItem value="bot"> Bolivia Time (BOT) </SelectItem>
                <SelectItem value="brt"> Brasilia Time (BRT) </SelectItem>
                <SelectItem value="clt"> Chile Standard Time (CLT) </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </ItemActions>
      </Item>
    </div>
    <ul
      v-if="linkedAccounts"
      class="divide-neutral-200 dark:divide-white/10 divide-y"
    >
      <li
        v-for="account in linkedAccounts"
        :key="account.id"
        class="flex items-center gap-3 py-4"
      >
        <div
          class="bg-neutral-100 dark:bg-white/10 flex h-12 w-12 items-center justify-center rounded-md"
        >
          <UIcon :name="getProviderIcon(account.provider)" class="text-xl" />
        </div>
        <div class="flex-1">
          <p>{{ getProviderName(account.provider) }}</p>
          <p class="text-neutral-500 text-xs">
            Connected on
            {{
              account.createdAt
                ? useDateFormat(account.createdAt, 'MMM D, YYYY').value
                : 'Unknown date'
            }}
          </p>
        </div>
        <UButton
          icon="i-lucide-trash"
          variant="ghost"
          color="error"
          :loading="loading"
          @click="unlinkAccount(account)"
        />
      </li>
    </ul>
  </UCard>
  <UModal
    v-model:open="linkAccountModal"
    title="Link Account"
    description="Link an account to your account."
  >
    <template #body>
      <div class="space-y-2">
        <AuthSocialLoginButton
          v-for="provider in availableProviders"
          :key="provider.id"
          :label="provider.name"
          :icon="provider.icon"
          :provider="provider.id"
        />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { useDateFormat } from '@vueuse/core'
import type { OAuthAccounts } from '@@/types/database'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemActions,
  ItemTitle,
} from '@/components/ui/item'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const linkAccountModal = ref(false)
const toast = useToast()
const loading = ref(false)

const { data: linkedAccounts } = await useFetch<OAuthAccounts[]>(
  '/api/me/linked-accounts',
  {
    key: 'linked-accounts',
  },
)

const availableProviders = [
  {
    id: 'google',
    name: 'Google',
    icon: 'i-logos-google-icon',
  },
  // {
  //   id: 'github',
  //   name: 'Github',
  //   icon: 'i-mdi-github',
  // },
  // {
  //   id: 'discord',
  //   name: 'Discord',
  //   icon: 'i-logos-discord-icon',
  // },
  // {
  //   id: 'spotify',
  //   name: 'Spotify',
  //   icon: 'i-logos-spotify-icon',
  // },
]

const getProviderIcon = (providerId: string) => {
  if (!providerId) return 'i-lucide-question-mark-circle'
  const provider = availableProviders.find((p) => p.id === providerId)
  return provider?.icon || 'i-lucide-question-mark-circle'
}

const getProviderName = (providerId: string) => {
  if (!providerId) return 'Unknown'
  const provider = availableProviders.find((p) => p.id === providerId)
  return provider?.name || 'Unknown'
}

const unlinkAccount = async (account: OAuthAccounts) => {
  try {
    loading.value = true
    await $fetch(`/api/me/linked-accounts/${account.id}`, {
      method: 'DELETE',
    })
    // Refresh the linked accounts list
    await refreshNuxtData('linked-accounts')
    toast.add({
      title: 'Account unlinked',
      description: `Your ${account.provider} account has been successfully unlinked`,
      color: 'success',
    })
  } catch (error: any) {
    const errorMessage = error.data?.statusMessage || 'Failed to unlink account'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
