<template>
  <main class="relative flex min-h-screen items-center justify-center">
    <div class="mx-auto w-full max-w-sm space-y-4">
      <img src="/logo.png" alt="logo" class="mx-auto h-10 w-auto" />

      <template v-if="mode === 'email'">
        <div class="text-center">
          <p class="text-lg font-bold">Create your account</p>
          <p class="text-sm text-neutral-500">
            Already have an account?
            <UButton to="/auth/login-passkey" variant="link" label="Sign In" />
          </p>
        </div>
        <UForm
          :schema="emailSchema"
          :state="state"
          class="mt-8 space-y-4"
          @submit="onSubmit"
        >
          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              placeholder="you@example.com"
              size="xl"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="loading"
            block
            color="orange"
            size="lg"
          >
            {{
              isSupported ? 'Sign Up with Passkey' : 'Sign Up with Email Code'
            }}
          </UButton>
        </UForm>
      </template>

      <template v-else>
        <div class="text-center">
          <p class="text-lg font-bold">Check your email</p>
          <p class="text-sm text-neutral-500">
            We've sent a 6-digit code to {{ state.email }}.
          </p>
        </div>
        <UForm
          :schema="otpSchema"
          :state="state"
          class="mt-8 space-y-4"
          @submit="onOtpSubmit"
        >
          <UFormField name="code">
            <UPinInput
              v-model="otpCode"
              :length="6"
              size="lg"
              otp
              placeholder="○"
              class="justify-center w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="loading"
            block
            color="orange"
            size="lg"
          >
            Verify & Create Account
          </UButton>
        </UForm>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { emailSchema } from '@@/shared/validations/auth'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({ layout: false })

const { isSupported } = useWebAuthn()
const { registerWithPasskey } = usePasskeys()
const { fetch: refreshSession } = useUserSession()
const toast = useToast()

const mode = ref<'email' | 'otp'>('email')
const loading = ref(false)
const state = reactive({ email: '', code: '' })
const otpSchema = z.object({ code: z.string().length(6) })

const otpCode = computed({
  get: () => state.code.split(''),
  set: (value: string[]) => {
    state.code = value.join('')
  },
})

const handleRegisterSuccess = async () => {
  await refreshSession()
  await navigateTo('/dashboard', { external: true })
}

const onSubmit = async (event: FormSubmitEvent<{ email: string }>) => {
  loading.value = true
  try {
    if (isSupported.value) {
      const success = await registerWithPasskey(event.data.email)
      if (success) await handleRegisterSuccess()
    } else {
      await $fetch('/api/auth/magic-link/register-request', {
        method: 'POST',
        body: { email: event.data.email },
      })
      toast.add({ title: 'Verification code sent!', color: 'success' })
      mode.value = 'otp'
    }
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

const onOtpSubmit = async (event: FormSubmitEvent<{ code: string }>) => {
  console.log('onOtpSubmit', event)
  loading.value = true
  try {
    await $fetch(
      'https://staging.striiveai.com/api/auth/magic-link/register-verify',
      {
        method: 'POST',
        body: { email: state.email, code: state.code },
      },
    )
    await handleRegisterSuccess()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
