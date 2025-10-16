<template>
  <div class="space-y-4">
    <template v-if="mode === 'login'">
      <UForm
        :schema="emailSchema"
        :state="loginState"
        class="space-y-4"
        @submit="onLoginSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="loginState.email"
            size="xl"
            class="w-full"
            type="email"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
          />
        </UFormField>
        <UButton type="submit" :loading="loading" block size="lg">
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

    <template v-else>
      <div class="text-center">
        <p class="text-sm text-neutral-500">
          Enter the 6-digit code sent to
          <span class="font-medium text-foreground">{{ otpState.email }}</span
          >.
        </p>
      </div>
      <UForm
        :schema="otpLoginSchema"
        :state="otpState"
        class="space-y-4"
        @submit="onOtpSubmit"
      >
        <UFormField name="code">
          <UPinInput
            v-model="otpCode"
            :length="6"
            size="lg"
            placeholder="○"
            class="justify-center w-full"
            type="number"
          />
        </UFormField>
        <UButton type="submit" :loading="loading" size="lg" block>
          Verify Code
        </UButton>
        <div class="text-center text-sm text-neutral-500 space-x-2">
          <UButton variant="link" size="xs" @click="resendCode"
            >Resend Code</UButton
          >
          <span>&bull;</span>
          <UButton variant="link" size="xs" @click="mode = 'login'"
            >Change Email</UButton
          >
        </div>
      </UForm>
    </template>

    <p class="pt-2 text-center text-sm text-neutral-500">
      Want to use a passkey?
      <UButton variant="link" class="p-0" @click="authStore.setView('login')">
        Sign In
      </UButton>
    </p>
  </div>
</template>

<script setup lang="ts">
import type { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { emailSchema, otpLoginSchema } from '@@/shared/validations/auth'
import { useAuthModal } from '~~/stores/authModal'

const emit = defineEmits(['success'])
const authStore = useAuthModal()

const toast = useToast()
const { fetch: refreshSession } = useUserSession()

const mode = ref<'login' | 'otp'>('login')
const loading = ref(false)

const loginState = reactive({ email: '' })
const otpState = reactive({ email: '', code: '' })

const otpCode = computed({
  get: () => otpState.code?.split('') || [],
  set: (value: string[]) => {
    otpState.code = value.join('')
  },
})

async function onLoginSubmit(
  event: FormSubmitEvent<z.output<typeof emailSchema>>,
) {
  await sendCode(event.data.email)
}

async function sendCode(email: string) {
  try {
    loading.value = true
    await $fetch('/api/auth/magic-link/login', {
      method: 'POST',
      body: { email },
    })
    mode.value = 'otp'
    otpState.email = email
    toast.add({ title: 'Code Sent!', color: 'success' })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

async function resendCode() {
  if (otpState.email) await sendCode(otpState.email)
}

async function onOtpSubmit(
  event: FormSubmitEvent<z.output<typeof otpLoginSchema>>,
) {
  try {
    loading.value = true
    await $fetch('/api/auth/magic-link/verify-otp', {
      method: 'POST',
      body: event.data,
    })
    await refreshSession()
    emit('success')
  } catch (error: any) {
    toast.add({
      title: 'Failed to verify code',
      description: error.data.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
