<template>
  <UCard>
    <template #header>
      <h3 class="text-sm font-medium">General Settings</h3>
    </template>
    <!-- Saving field for later use -->
    <!-- <UFormField
    label="Portfolio logo (Recommended size: 1 MB, 1:1 aspect ratio)"
    name="logo"
  >
    <AppAvatarUploader
      v-model="state.logo"
      @file-selected="handleFileSelected"
    />
  </UFormField> -->
    <UForm
      :schema="portfolioSchema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit as any"
    >
      <UFormField required label="Portfolio name" name="name">
        <UInput v-model="state.name" class="w-full" />
      </UFormField>

      <UFormField
        label="Portfolio URL"
        :help="`${host}/dashboard/${state.slug}`"
      >
        <UInput v-model="state.slug" variant="subtle" class="w-full" disabled />
      </UFormField>

      <UFormField label="Portfolio ID">
        <UInput
          :value="currentPortfolio?.id || ''"
          variant="subtle"
          class="w-full"
          disabled
        />
      </UFormField>

      <UButton
        type="submit"
        color="orange"
        :loading="loading"
        :disabled="loading"
      >
        Save Changes
      </UButton>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { usePortfolio } from '@/composables/usePortfolio'

const { portfolioSchema, updatePortfolio, currentPortfolio, loading } =
  usePortfolio()
const selectedFile = ref<File | null>(null)

const state = reactive({
  name: currentPortfolio.value?.name || '',
  slug: currentPortfolio.value?.slug || '',
  logo: currentPortfolio.value?.logo || '',
})

const handleFileSelected = (file: File | null) => {
  selectedFile.value = file
  if (!file) {
    state.logo = ''
  }
}

const uploadLogo = async () => {
  try {
    if (!selectedFile.value) return ''
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    const fileUrl = await $fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })
    return fileUrl
  } catch (error) {
    throw new Error('Failed to upload logo')
  }
}

const onSubmit = async (event: FormSubmitEvent<typeof portfolioSchema>) => {
  if (!currentPortfolio.value?.id) return

  try {
    let filePath = ''

    if (selectedFile.value) {
      filePath = await uploadLogo()
    } else if (state.logo) {
      filePath = currentPortfolio.value.logo
    } else {
      filePath = `https://api.dicebear.com/9.x/glass/svg?seed=${event.data.name}`
    }

    const portfolioData = {
      ...event.data,
      logo: filePath,
    }

    await updatePortfolio(currentPortfolio.value.id, portfolioData)
  } catch (error) {
    console.error(error)
  }
}

const host = useRuntimeConfig().public.host
</script>
