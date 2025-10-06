<template>
  <UCard>
    <template #header>
      <h3 class="text-sm font-medium">Danger Zone</h3>
    </template>
    <div class="flex items-start gap-2 md:items-center">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10"
      >
        <UIcon name="i-lucide-trash-2" class="h-5 w-5 text-red-500" />
      </div>
      <div class="flex-1">
        <h4 class="font-medium">Delete Portfolio</h4>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Deleting a Portfolio is irreversible and will remove all data
          associated with it.
        </p>
      </div>
      <UModal
        :title="`Delete ${currentPortfolio?.name}`"
        description="This action is irreversible and will remove all data associated with it"
        close-icon="i-lucide-x"
      >
        <UButton
          variant="solid"
          class="cursor-pointer bg-red-500/10 text-red-500 hover:bg-red-500/20"
          size="lg"
        >
          Delete Permanently
        </UButton>

        <template #body>
          <UForm
            :schema="formSchema"
            :state="formState"
            class="space-y-4"
            @submit="handleSubmit"
          >
            <UFormField
              label="Portfolio Name"
              name="portfolioName"
              :help="`Please type '${currentPortfolio?.name}' to confirm deletion`"
            >
              <UInput
                v-model="formState.portfolioName"
                placeholder="Enter Portfolio name"
                class="w-full"
              />
            </UFormField>
            <Button
              variant="default"
              class="disabled:bg-black-500 disabled:text-black-100 cursor-pointer bg-red-500/10 text-red-500 hover:bg-red-500/50"
              size="lg"
              type="submit"
              block
              :loading="loading"
              :disabled="formState.portfolioName !== currentPortfolio?.name"
            >
              Delete Permanently
            </Button>
          </UForm>
        </template>
      </UModal>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { z } from 'zod'
import { usePortfolio } from '@/composables/usePortfolio'

const toast = useToast()
const { currentPortfolio, deletePortfolio, portfolios, loading } =
  usePortfolio()

const formSchema = z.object({
  portfolioName: z
    .string()
    .min(1, 'Portfolio name is required')
    .refine((val) => val === currentPortfolio.value.name, {
      message: 'Portfolio name does not match',
    }),
})

const router = useRouter()

type Schema = z.output<typeof formSchema>

const formState = reactive<Partial<Schema>>({
  portfolioName: '',
})

async function handleSubmit() {
  if (!currentPortfolio.value) return
  await deletePortfolio(currentPortfolio.value.id)
}
</script>
