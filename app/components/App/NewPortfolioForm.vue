<template>
  <div class="mt-4 flex justify-center">
    <UButton
      @click="onSubmit"
      type="button"
      class="dark:bg-orange-500 dark:text-white"
      color="orange"
      size="lg"
      block
      :loading="loading"
      :disabled="loading"
    >
      Create portfolio
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { Portfolio } from '@@/types/database'
import { usePlaidStore } from '~~/stores/plaid'

const plaid = usePlaidStore()
const toast = useToast()
const loading = ref(false)
const portfolios = useState<Portfolio[]>('portfolios')
const { setLastUsedPortfolio } = usePortfolioPreferences()

const { accounts } = storeToRefs(plaid)

const emit = defineEmits<{
  success: [portfolio: Portfolio]
}>()

const onSubmit = async (): FormSubmitEvent<typeof schema> => {
  loading.value = true
  try {
    await plaid.connectBank()

    console.log(accounts.value)

    const results = await Promise.allSettled(
      accounts.value.map((account) =>
        $fetch<Portfolio>('/api/portfolios', {
          method: 'POST',
          body: { name: account.name },
        }),
      ),
    )

    const successes = results
      .filter(
        (r): r is PromiseFulfilledResult<Portfolio> => r.status === 'fulfilled',
      )
      .map((r) => r.value)

    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    )

    if (successes.length) {
      portfolios.value.push(...successes)
      setLastUsedPortfolio(successes[0].slug)
      toast.add({
        title: 'Portfolios created',
        description: `Created ${successes.length} portfolios.`,
        color: 'success',
      })
      emit('success', successes[0])
    }

    // 4) Report any that failed
    if (failures.length) {
      failures.forEach((f, i) => {
        toast.add({
          title: `Failed to create ${accounts.value[i].name}`,
          description:
            (f.reason as any).statusCode === 409
              ? 'Already connected'
              : (f.reason as any).message || 'Please try again',
          color: 'error',
        })
      })
      if (!successes.length) {
        throw new Error('All portfolio creations failed')
      }
    }
  } catch (error) {
    toast.add({
      title: `Failed to create portfolio`,
      description:
        (error as any).message ||
        (error as any).statusMessage ||
        'Please try again',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const schema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  slug: z
    .string()
    .min(1, 'Portfolio slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Only lowercase letters, numbers, and single hyphens between characters allowed',
    ),
})
</script>

<!-- legacy
 
<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit as any"
  >
    <UFormField
      label="Portfolio logo (Recommended size: 1 MB, 1:1 aspect ratio)"
      name="logo"
    >
      <AppAvatarUploader
        v-model="imagePreview"
        @file-selected="handleFileSelected"
      />
    </UFormField>

    <UFormField required label="Portfolio name" name="name">
      <UInput
        v-model="state.name"
        placeholder="Personal or Company Name"
        class="w-full"
        size="lg"
      />
    </UFormField>

    <UFormField
      label="Portfolio URL"
      name="slug"
      required
      :help="`${host}/dashboard/${state.slug}`"
    >
      <UInput
        v-model="state.slug"
        placeholder="my-awesome-portfolio"
        class="w-full"
        size="lg"
      />
      <div v-if="slugAutoAdjustedMessage" class="text-warning mt-1 text-xs">
        {{ slugAutoAdjustedMessage }}
      </div>
    </UFormField>

    <UButton
      color="neutral"
      type="submit"
      size="lg"
      block
      :loading="loading"
      :disabled="loading"
    >
      Create portfolio
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { Portfolio } from '@@/types/database'
import { FetchError } from 'ofetch'
import { watch, nextTick, ref } from 'vue'

const toast = useToast()
const portfolios = useState<Portfolio[]>('portfolios')
const loading = ref(false)
const imagePreview = ref<string | undefined>(undefined)
const selectedFile = ref<File | null>(null)
const { setLastUsedPortfolio } = usePortfolioPreferences()

const emit = defineEmits<{
  success: [portfolio: Portfolio]
}>()

const handleFileSelected = (file: File | null) => {
  selectedFile.value = file
}

const schema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  logo: z.string().optional(),
  slug: z
    .string()
    .min(1, 'Portfolio slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Only lowercase letters, numbers, and single hyphens between characters allowed',
    ),
})

const state = reactive({
  name: '',
  slug: '',
  logo: '',
})

let userEditedSlug = false
let programmaticallyUpdatingSlug = false
let lastAutoSlug = ''
const slugAutoAdjustedMessage = ref('')

// Helper to generate slug from name
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars except space and dash
    .replace(/\s+/g, '-') // replace spaces with dash
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
}

// Helper to check slug uniqueness and increment if needed
async function getAvailableSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let suffix = 1
  let wasTaken = false
  while (true) {
    try {
      const existingPortfolio = await $fetch<{
        id: string
        name: string
        slug: string
      } | null>('/api/portfolios/check-slug', {
        method: 'POST',
        body: { slug },
      })
      if (!existingPortfolio) {
        // If the slug was taken and we had to increment, show a message
        if (wasTaken) {
          slugAutoAdjustedMessage.value = `"${baseSlug}" is taken so we have just made it unique, you can adjust the Portfolio URL however you want to an available name.`
        }
        return slug
      }
      wasTaken = true
      slug = `${baseSlug}-${suffix}`
      suffix++
    } catch {
      // If API fails, just return the current slug
      return slug
    }
  }
}

watch(
  () => state.name,
  async (newName) => {
    if (!userEditedSlug) {
      const baseSlug = generateSlug(newName)
      if (!baseSlug) {
        programmaticallyUpdatingSlug = true
        state.slug = ''
        lastAutoSlug = ''
        slugAutoAdjustedMessage.value = ''
        programmaticallyUpdatingSlug = false
        return
      }
      // Only check for available slug if name is not empty
      programmaticallyUpdatingSlug = true
      state.slug = baseSlug
      lastAutoSlug = baseSlug
      slugAutoAdjustedMessage.value = ''
      await nextTick() // ensure reactivity
      const availableSlug = await getAvailableSlug(baseSlug)
      if (!userEditedSlug) {
        state.slug = availableSlug
        lastAutoSlug = availableSlug
        await nextTick()
        // Trigger input event on the slug input to ensure UI/validation updates
        const slugInput = document.querySelector('input[name="slug"]')
        if (slugInput) {
          slugInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
      programmaticallyUpdatingSlug = false
    }
  },
)

watch(
  () => state.slug,
  (newSlug) => {
    if (programmaticallyUpdatingSlug) return
    // If the slug is cleared, re-enable auto-generation
    if (newSlug === '') {
      userEditedSlug = false
      slugAutoAdjustedMessage.value = ''
      return
    }
    // Only set userEditedSlug if the new slug does NOT match the last auto-generated value
    if (newSlug !== lastAutoSlug) {
      userEditedSlug = true
      slugAutoAdjustedMessage.value = ''
    }
  },
)

const onSubmit = async (event: FormSubmitEvent<typeof schema>) => {
  loading.value = true
  const data = schema.parse(event.data)
  try {
    // Check for slug conflict
    const existingPortfolio = await $fetch<{
      id: string
      name: string
      slug: string
    } | null>('/api/portfolios/check-slug', {
      method: 'POST',
      body: { slug: data.slug },
    })

    if (existingPortfolio) {
      toast.add({
        title: 'Portfolio URL already in use',
        description: `You are already a member of portfolio "${existingPortfolio.name}" with URL /${existingPortfolio.slug}. Please choose a different URL.`,
        color: 'error',
      })
      loading.value = false
      return
    }

    const filePath = selectedFile.value
      ? await uploadLogo()
      : `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(data.name)}`
    const portfolioData = { ...data, logo: filePath }
    const newPortfolio = await $fetch<Portfolio>('/api/portfolios', {
      method: 'POST',
      body: portfolioData,
    })
    portfolios.value.push(newPortfolio)
    setLastUsedPortfolio(newPortfolio.slug)
    toast.add({
      title: 'Portfolio created successfully',
      color: 'success',
    })
    emit('success', newPortfolio)
  } catch (error) {
    toast.add({
      title: 'Failed to create portfolio',
      description:
        (error as any).message ||
        (error as any).statusMessage ||
        'Please try again',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const uploadLogo = async () => {
  try {
    if (!selectedFile.value) return ''
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    const filePath = await $fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })
    return `/images/${filePath}`
  } catch (error) {
    if (error instanceof FetchError) {
      throw new Error(`Failed to upload logo: ${error.message}`, {
        cause: error,
      })
    } else {
      console.error(error)
      throw new Error('Failed to upload logo', { cause: error })
    }
  }
}

const host = useRuntimeConfig().public.host
</script>
 -->
