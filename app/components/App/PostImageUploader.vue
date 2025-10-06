<template>
  <div class="relative flex flex-col gap-2">
    <div class="absolute -right-2 -top-2 z-30">
      <UButton
        v-if="model"
        icon="i-lucide-x"
        color="error"
        variant="solid"
        size="xs"
        @click="removeImage"
      />
    </div>
    <button
      type="button"
      class="bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-900 relative z-20 flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg"
      @click="open()"
    >
      <UIcon
        v-if="!model"
        name="i-lucide-image-plus"
        class="text-neutral-400 h-4 w-5"
      />
      <img v-else :src="model" class="h-full w-full object-cover" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useFileDialog, useObjectUrl } from '@vueuse/core'

const model = defineModel<string | undefined>()

const { files, open, onChange } = useFileDialog({
  accept: 'image/*',
  multiple: false,
})

const emit = defineEmits<{
  'file-selected': [file: File | null]
}>()

onChange(() => {
  const file = files.value?.[0]
  if (file) {
    const objectUrl = useObjectUrl(file)
    model.value = objectUrl.value
    emit('file-selected', file)
  }
})

const removeImage = () => {
  model.value = undefined
  emit('file-selected', null)
}
</script>
