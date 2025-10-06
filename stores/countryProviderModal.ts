import { defineStore } from 'pinia'
import regionGroups from '@/assets/data/region-providers.json'

export interface Country {
  code: string
  name: string
  securityProviders: Record<string, string[]>
}
export interface RegionGroup {
  label: string
  regions: Country[]
}
const providers = regionGroups as RegionGroup[]

export interface ProviderChoice {
  country: string
  securityProvider: string
  provider: string
  institutionId: string
}

export const useCountryProviderModal = defineStore(
  'countryProviderModal',
  () => {
    const open = ref(false)
    const step = ref<1 | 2>(1)

    const selectedProvider = ref<ProviderChoice | null>(null)

    const allCountries = computed<Country[]>(() =>
      providers.flatMap((g) => g.regions),
    )

    let resolver: ((v: ProviderChoice | null) => void) | null = null

    function pickProvider(): Promise<ProviderChoice | null> {
      open.value = true
      step.value = 1
      selectedProvider.value = null
      return new Promise((resolve) => {
        resolver = resolve
      })
    }

    function chooseCountry(code: string) {
      const country = allCountries.value.find((c) => c.code === code)
      if (!country) return

      if (!selectedProvider.value) {
        selectedProvider.value = {
          country: code,
          securityProvider: '',
          provider: '',
          institutionId: '',
        }
      } else {
        selectedProvider.value.country = code
      }

      const [firstKey] = Object.keys(country.securityProviders)
      selectedProvider.value.securityProvider = firstKey ?? ''
    }

    function chooseProvider(provider: string, institutionId: string) {
      if (!selectedProvider.value) return
      selectedProvider.value.provider = provider
      selectedProvider.value.institutionId = institutionId
    }

    function confirmSelection() {
      if (!selectedProvider.value.country) return

      resolver?.(selectedProvider.value)
      resolver = null
      open.value = false
    }

    function closeModal() {
      resolver?.(null)
      resolver = null
      open.value = false
    }

    return {
      open,
      step,
      selectedProvider,
      providers,
      allCountries,
      pickProvider,
      chooseCountry,
      chooseProvider,
      confirmSelection,
      closeModal,
    }
  },
)
