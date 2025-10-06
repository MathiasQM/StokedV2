<template>
  <Drawer v-model:open="cpModal.open">
    <DrawerContent class="mb-5">
      <div class="mx-auto w-full max-w-sm space-y-10">
        <DrawerHeader>
          <DrawerTitle class="text-center">
            {{ header.title }}
          </DrawerTitle>
          <DrawerDescription class="text-center">
            {{ header.description }}
          </DrawerDescription>
        </DrawerHeader>

        <div v-if="cpModal.step === 1" class="flex flex-col items-center justify-center gap-2 px-4">
          <div v-for="group in cpModal.providers" :key="group.label" class="w-full space-y-2">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ group.label }}
            </p>

            <div class="flex flex-wrap justify-center gap-2">
              <button v-for="country in group.regions" :key="country.code"
                @click="() => cpModal.chooseCountry(country.code)" :class="[
                  'flex w-20 items-center gap-2 rounded-md border px-3 py-2 transition',
                  selectedProvider?.country === country.code
                    ? 'border-orange-500 bg-orange-100 dark:border-orange-400 dark:bg-orange-900/20'
                    : 'dark:border-black-700 dark:bg-black-800 border-gray-300',
                ]">
                <Icon :name="`i-circle-flags-${country.code.toLowerCase()}`" class="h-5 w-5" />
                <span class="text-sm">{{ country.code }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 2: Select provider -->
        <div v-else-if="cpModal.step === 2" class="flex flex-col items-center justify-center gap-2 px-4">
          <p class="w-full text-sm font-medium text-gray-700 dark:text-gray-300">
            Your connected institutions
          </p>
          <div class="p-3 border w-full rounded-lg min-h-20 flex justify-center bg-black-900 border-gray-500">
            <p v-if="filteredConnections.length === 0" class="text-sm text-gray-400 italic self-center">
              You have no active connections in this region.
            </p>
            <div v-for="institution in filteredConnections" :key="institution.institutionId" class="w-full space-y-2">
              <button @click="handleInstitutionSelection(institution)" :class="[
                'w-full rounded-md border px-4 py-2 text-left text-sm transition',
                selectedProvider?.institutionId === institution.institutionId
                  ? 'border-orange-500 bg-orange-100 dark:border-orange-400 dark:bg-orange-900/20'
                  : 'dark:border-black-700 dark:bg-black-800 border-gray-300',
              ]">
                {{ institution.institutionName }}
              </button>
            </div>
          </div>

        </div>

        <DrawerFooter>
          <div class="flex w-full flex-col gap-2">
            <Button v-if="cpModal.step === 1" @click="goNext" :disabled="!selectedProvider?.country"
              class="w-full bg-orange-500">
              Select region
            </Button>

            <Button v-else @click="handleInstitutionSelection()" class="w-full bg-orange-500">
              Sync new institution
            </Button>

            <Button v-if="cpModal.step === 2" variant="outline" class="w-full" @click="goBack">
              Back
            </Button>

            <DrawerClose as-child>
              <Button variant="ghost">Close</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { useCountryProviderModal } from '@@/stores/countryProviderModal'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { watch } from 'vue'
import { usePlaidStore } from '~~/stores/plaid'
import type { ConnectedInstitution } from '~~/types/plaid'

const plaidStore = usePlaidStore()
onMounted(async () => {
  await plaidStore.fetchConnectedInstitutions()
})

const { accounts, connectedInstitutions } = storeToRefs(plaidStore)
const cpModal = useCountryProviderModal()
const { selectedProvider } = storeToRefs(cpModal)

const filteredConnections = computed(() =>
  connectedInstitutions.value.filter(
    (c) => c.countryCode === selectedProvider.value?.country,
  ),
)

/* Convenience: get the full Country object from its code */
const selectedCountry = computed(() =>
  cpModal.allCountries.find(
    (c) => c.code === selectedProvider.value?.country,
  ) ?? null,
)


const header = computed(() => {
  if (cpModal.step === 1) {
    return {
      title: "Let's get you started",
      description: 'Choose your country to sync a portfolio.',
    }
  }
  return {
    title: 'Choose a provider',
    description: `Select the provider you use in ${selectedCountry.value?.name ?? 'your region'}.`,
  }
})

function goNext() {
  if (selectedProvider.value?.country) cpModal.step = 2
}

function goBack() {
  cpModal.step = 1
  selectedProvider.value = null
}

function handleInstitutionSelection(institution?: ConnectedInstitution) {
  if (institution) {
    cpModal.chooseCountry(institution.countryCode)
    cpModal.chooseProvider(institution.provider, institution.institutionId)
    cpModal.confirmSelection()
  } else {
    cpModal.confirmSelection()
  }
}

watch(
  () => cpModal.open,
  (isOpen) => {
    if (!isOpen) {
      cpModal.step = 1
      selectedProvider.value = null
    }
  },
)
</script>
