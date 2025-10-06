<template>
  <main class="flex h-full items-center justify-center p-5">
    <div class="mx-auto w-full max-w-sm space-y-4">
      <img src="/logo.png" alt="logo" class="mx-auto h-10 w-auto" />
      <div class="text-center">
        <p class="text-lg font-bold text-black dark:text-white">
          Sign in to Striive
        </p>
        <p class="text-sm text-neutral-500">
          Dont have an account?
          <UButton
            padding="none"
            trailing-icon="i-lucide-arrow-right"
            color="orange"
            to="/auth/register"
            variant="link"
            label="Get Started"
            class="font-normal text-orange-500"
            :ui="{
              trailingIcon: 'size-4',
            }"
            square
          />
        </p>
      </div>
      <UForm
        :schema="loginUserSchema"
        :state="state"
        class="mt-8 space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            class="w-full lowercase"
            size="lg"
            tabindex="1"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="state.password"
            type="password"
            class="w-full"
            size="lg"
            tabindex="2"
          />
          <template #hint>
            <UButton
              variant="link"
              to="/auth/forgot-password"
              label="Forgot password?"
              size="xs"
              color="orange"
              class="text-neutral-500"
              tabindex="3"
            />
          </template>
        </UFormField>

        <UButton
          type="submit"
          :loading="loading"
          block
          color="orange"
          class="cursor-pointer bg-orange-500 text-white hover:bg-orange-400"
          size="lg"
        >
          Submit
        </UButton>
      </UForm>
      <USeparator label="OR" />
      <div class="grid grid-cols-1 gap-2">
        <AuthSocialLoginButton
          label="Google"
          icon="i-logos-google-icon"
          provider="google"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['invite-email'],
  layout: false,
})
import type { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { loginUserSchema } from '@@/shared/validations/auth'
type Schema = z.output<typeof loginUserSchema>

const loading = ref(false)
const { login } = useAuth()
const inviteEmail = useState<string>('inviteEmail')

const state = reactive<Partial<Schema>>({
  email: inviteEmail.value,
  password: undefined,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  const { error } = await login(event.data)
  if (!error) {
    await navigateTo('/dashboard')
  }
  loading.value = false
}
</script>
