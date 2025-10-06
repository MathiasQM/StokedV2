<template>
  <main class="flex min-h-screen items-center justify-center">
    <div class="mx-auto w-full max-w-sm space-y-4">
      <img src="/logo.png" alt="logo" class="mx-auto h-10 w-auto" />
      <div class="text-center">
        <p class="text-lg font-bold">Reset your password</p>
        <p class="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
          Enter your email below to reset your password.
        </p>
      </div>
      <UForm
        :schema="emailSchema"
        :state="state"
        class="mt-8 space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" class="w-full" size="lg" />
        </UFormField>

        <UButton
          type="submit"
          :loading="loading"
          block
          color="orange"
          class="cursor-pointer"
          size="lg"
        >
          Send reset instructions
        </UButton>
        <UButton
          variant="link"
          to="/auth/login"
          label="Back to login"
          size="md"
          color="orange"
          class="text-neutral-500"
          tabindex="3"
        />
      </UForm>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { emailSchema } from '@@/shared/validations/auth'

type PasswordResetSchema = z.output<typeof emailSchema>
const loading = ref(false)
const { forgotPassword } = useAuth()

const state = reactive<Partial<PasswordResetSchema>>({
  email: undefined,
})

const onSubmit = async (event: FormSubmitEvent<PasswordResetSchema>) => {
  loading.value = true
  await forgotPassword(event.data.email)
  loading.value = false
}
</script>
