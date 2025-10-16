<template>
  <div class="space-y-4">
    <div
      v-if="isRedirecting"
      class="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
    >
      <div class="text-center">
        <UButton color="orange" loading size="xl" variant="soft" />
        <p class="mt-4 text-sm font-medium">Setting up your account...</p>
      </div>
    </div>

    <template v-if="mode === 'email'">
      <UForm
        :schema="emailSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            placeholder="you@example.com"
            size="xl"
          />
        </UFormField>
        <UButton
          type="submit"
          :loading="registering"
          block
          color="orange"
          size="lg"
        >
          {{ isSupported ? 'Sign Up with Passkey' : 'Sign Up with Email Code' }}
        </UButton>
      </UForm>
    </template>

    <template v-else>
      <div class="text-center">
        <p class="text-sm text-neutral-500">
          We've sent a 6-digit code to
          <span class="font-medium text-foreground">{{ state.email }}</span
          >.
        </p>
      </div>
      <UForm
        :schema="otpSchema"
        :state="state"
        class="space-y-4"
        @submit="onOtpSubmit"
      >
        <UFormField name="code">
          <UPinInput
            v-model="otpCode"
            :length="6"
            size="lg"
            placeholder="○"
            class="justify-center"
            type="number"
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
        <div class="text-center text-sm text-neutral-500 space-x-2">
          <UButton variant="link" size="xs" @click="resendCode"
            >Resend Code</UButton
          >
          <span>&bull;</span>
          <UButton variant="link" size="xs" @click="mode = 'email'"
            >Change Email</UButton
          >
        </div>
      </UForm>
    </template>

    <p class="pt-2 text-center text-sm text-neutral-500">
      Already have an account?
      <UButton variant="link" class="p-0" @click="authStore.setView('login')">
        Sign In
      </UButton>
    </p>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { emailSchema } from '@@/shared/validations/auth'
import type { FormSubmitEvent } from '#ui/types'
import { useAuthModal } from '~/stores/authModal'

const emit = defineEmits(['success'])
const authStore = useAuthModal()

const { registerWithPasskey, registering } = usePasskeys()
const { isSupported } = useWebAuthn()
const { fetch: refreshSession } = useUserSession()
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

async function handleRegisterSuccess() {
  isRedirecting.value = true
  await refreshSession()
  emit('success')
}

async function onSubmit(event: FormSubmitEvent<{ email: string }>) {
  if (isSupported.value) {
    const success = await registerWithPasskey(event.data.email)
    if (success) await handleRegisterSuccess()
  } else {
    await sendOtpCode(event.data.email)
  }
}

async function sendOtpCode(email: string) {
  try {
    registering.value = true
    await $fetch('/api/auth/magic-link/register-request', {
      method: 'POST',
      body: { email },
    })
    toast.add({ title: 'Verification code sent!', color: 'green' })
    mode.value = 'otp'
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message,
      color: 'red',
    })
  } finally {
    registering.value = false
  }
}

async function resendCode() {
  if (state.email) await sendOtpCode(state.email)
}

async function onOtpSubmit() {
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
      color: 'red',
    })
  } finally {
    registering.value = false
  }
}
</script>
