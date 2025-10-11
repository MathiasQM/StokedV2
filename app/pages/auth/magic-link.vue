<template>
  <main class="flex min-h-screen items-center justify-center p-5">
    <div class="mx-auto w-full max-w-sm space-y-4">
      <img src="/logo.png" alt="logo" class="mx-auto h-10 w-auto" />

      <template v-if="mode === 'login'">
        <div class="text-center">
          <p class="text-lg font-bold">Sign in with a code</p>
          <p class="text-neutral-500 text-sm">
            Enter your email to receive a 6-digit verification code.
          </p>
        </div>
        <UForm
          :schema="emailSchema"
          :state="loginState"
          class="mt-8 space-y-4"
          @submit="onLoginSubmit"
        >
          <UFormField label="Email" name="email">
            <UInput v-model="loginState.email" class="w-full" size="lg" />
          </UFormField>

          <UButton
            type="submit"
            :loading="loading"
            block
            color="orange"
            class="cursor-pointer"
            size="lg"
          >
            Send Code
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
      </template>

      <div v-else>
        <div class="text-center">
          <p class="text-lg font-bold">We've sent you a 6-digit code</p>
          <p class="text-neutral-500 dark:text-neutral-400 text-sm">
            Please check your inbox at
            <span class="font-medium text-neutral-800 dark:text-neutral-200">{{
              otpState.email
            }}</span>
            for the code.
          </p>
        </div>
        <UForm
          :schema="otpLoginSchema"
          :state="otpState"
          class="mx-auto mt-8 max-w-max space-y-4"
          @submit="onOtpSubmit"
        >
          <UFormField name="code">
            <UPinInput
              v-model="otpCode"
              :length="6"
              size="lg"
              otp
              type="number"
              placeholder="○"
              class="justify-center"
            />
          </UFormField>
          <UButton
            type="submit"
            :loading="loading"
            color="orange"
            class="cursor-pointer"
            size="lg"
            block
          >
            Verify Code
          </UButton>

          <div class="text-center text-sm text-neutral-500 mt-2 space-x-2">
            <UButton variant="link" size="xs" @click="resendCode">
              Resend Code
            </UButton>
            <span>&bull;</span>
            <UButton variant="link" size="xs" @click="mode = 'login'">
              Change Email
            </UButton>
          </div>
        </UForm>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { emailSchema, otpLoginSchema } from '@@/shared/validations/auth'

type LoginSchema = z.output<typeof emailSchema>
type OtpSchema = z.output<typeof otpLoginSchema>

definePageMeta({
  layout: false,
})

const { isSupported } = useWebAuthn()
const passkeysAreSupported = ref(true)

onMounted(async () => {
  passkeysAreSupported.value = isSupported.value
  console.log('passkeysAreSupported', passkeysAreSupported.value)
  // if (passkeysAreSupported.value) {
  //   return navigateTo('/auth/login-passkey')
  // }
})

const toast = useToast()
const { fetch: refreshSession } = useUserSession()

const mode = ref<'login' | 'otp'>('login')
const loading = ref(false)

const loginState = reactive<Partial<LoginSchema>>({
  email: undefined,
})

const otpState = reactive<Partial<OtpSchema>>({
  email: undefined,
  code: undefined,
})

const otpCode = computed({
  get: () => otpState.code?.split('') || [],
  set: (value: string[]) => {
    otpState.code = value.join('')
  },
})

async function onLoginSubmit(event: FormSubmitEvent<LoginSchema>) {
  try {
    loading.value = true
    await $fetch('/api/auth/magic-link/login', {
      method: 'POST',
      body: event.data,
    })
    mode.value = 'otp'
    otpState.email = event.data.email
  } catch (error) {
    toast.add({
      title: 'Failed to send verification code',
      description: (error as any).data.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

async function onOtpSubmit(event: FormSubmitEvent<OtpSchema>) {
  try {
    loading.value = true
    await $fetch('/api/auth/magic-link/verify-otp', {
      method: 'POST',
      body: event.data,
    })
    await refreshSession()
    await navigateTo('/dashboard')
  } catch (error) {
    toast.add({
      title: 'Failed to verify code',
      description: (error as any).data.message,
      color: 'error',
    })
  } finally {
    loading.value = false
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
