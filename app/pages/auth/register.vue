<template>
  <main class="relative flex min-h-screen items-center justify-center p-5">
    <div
      v-if="isRedirecting"
      class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80"
    >
      <div class="text-center">
        <UButton color="orange" loading size="xl" variant="soft" />
        <p class="mt-4 text-sm font-medium">Setting up your account...</p>
      </div>
    </div>
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
            :loading="registering"
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
            We've sent a 6-digit code to
            <span class="font-medium text-neutral-800 dark:text-neutral-200">{{
              state.email
            }}</span
            >.
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
            :loading="registering"
            block
            color="orange"
            size="lg"
          >
            Verify & Create Account
          </UButton>

          <div class="text-center text-sm text-neutral-500 mt-2 space-x-2">
            <UButton variant="link" size="xs" @click="resendCode">
              Resend Code
            </UButton>
            <span>&bull;</span>
            <UButton variant="link" size="xs" @click="mode = 'email'">
              Change Email
            </UButton>
          </div>
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

const { registerWithPasskey, registering } = usePasskeys()
const { isSupported } = useWebAuthn()
const { fetch: refreshSession, loggedIn } = useUserSession()
const toast = useToast()

const isRedirecting = ref(false)
const mode = ref<'email' | 'otp'>('email')
const state = reactive({ email: '', code: '' })
const otpSchema = z.object({ code: z.string().length(6) })

const otpCode = computed({
  get: () => state.code.split(''),
  set: (value: string[]) => {
    state.code = value.join('')
  },
})

const handleRegisterSuccess = async () => {
  isRedirecting.value = true
  await refreshSession()
  await navigateTo('/dashboard', { external: true })
}

const onSubmit = async (event: FormSubmitEvent<{ email: string }>) => {
  if (isSupported.value) {
    const success = await registerWithPasskey(event.data.email)
    if (success) {
      await handleRegisterSuccess()
    }
  } else {
    try {
      registering.value = true
      await $fetch('/api/auth/magic-link/register-request', {
        method: 'POST',
        body: { email: event.data.email },
      })
      toast.add({ title: 'Verification code sent!', color: 'success' })
      mode.value = 'otp'
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.data?.message,
        color: 'error',
      })
    } finally {
      registering.value = false
    }
  }
}

const onOtpSubmit = async (event: FormSubmitEvent<{ code: string }>) => {
  try {
    registering.value = true
    await $fetch('/api/auth/magic-link/register-verify', {
      method: 'POST',
      body: { email: state.email, code: state.code },
    })
    await handleRegisterSuccess()
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message,
      color: 'error',
    })
  } finally {
    registering.value = false
  }
}

async function resendCode() {
  if (!otpState.email) return
  try {
    loading.value = true
    await $fetch('/api/auth/magic-link/login', {
      method: 'POST',
      body: { email: otpState.email },
    })
    toast.add({
      title: 'Code Sent!',
      description: `A new verification code has been sent to ${otpState.email}.`,
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: 'Failed to resend code',
      description: (error as any).data.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
