<template>
  <template v-if="!isMobile">
    <Dialog v-model:open="authStore.open">
      <DialogContent class="overflow-hidden">
        <div class="absolute -top-10 inset-0 -z-10 flex justify-center">
          <div class="linear-gradient-layer absolute -z-1"></div>
          <div class="linear-gradient-layer-bottom absolute -z-1"></div>
          <div class="radial-gradient-layer absolute -z-1"></div>
        </div>
        <div class="mx-auto w-full max-w-sm space-y-8">
          <div class="gradient-header relative w-full">
            <div
              class="flex flex-col items-center justify-center p-4 text-white"
            >
              <DrawerTitle
                class="text-center text-xl font-bold tracking-wide my-5"
              >
                {{ name }}
              </DrawerTitle>
              <DrawerTitle class="text-center"> {{ title }} </DrawerTitle>
              <DrawerDescription class="text-center text-sm opacity-80">
                {{ description }}
              </DrawerDescription>
            </div>
          </div>
          <div class="px-4 mt-20">
            <component
              :is="authViews[authStore.view]"
              @success="handleSuccess"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </template>

  <template v-else>
    <Drawer v-model:open="authStore.open" class="w-auto max-w-none">
      <DrawerContent class="padding-env-bottom overflow-hidden">
        <div class="absolute -top-10 inset-0 -z-10 flex justify-center">
          <div class="linear-gradient-layer absolute -z-1"></div>
          <div class="linear-gradient-layer-bottom absolute -z-1"></div>
          <div class="radial-gradient-layer absolute -z-1"></div>
        </div>
        <div class="mx-auto w-full max-w-sm space-y-8">
          <div class="gradient-header relative w-full">
            <div
              class="flex flex-col items-center justify-center p-4 text-white"
            >
              <DrawerTitle
                class="text-center text-xl font-bold tracking-wide my-5"
              >
                {{ name }}
              </DrawerTitle>
              <DrawerTitle class="text-center"> {{ title }} </DrawerTitle>
              <DrawerDescription class="text-center text-sm opacity-80">
                {{ description }}
              </DrawerDescription>
            </div>
          </div>
          <div class="px-4 mt-20">
            <component
              :is="authViews[authStore.view]"
              @success="handleSuccess"
            />
          </div>

          <DrawerFooter>
            <DrawerClose as-child>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  </template>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthModal, type AuthView } from '~~/stores/authModal'

const isMobile = useIsMobile()

const name = useRuntimeConfig().public.appName

// Lazily load auth components for better performance
const AuthLogin = defineAsyncComponent(
  () => import('~/components/auth/login-passkey.vue'),
)
const AuthRegister = defineAsyncComponent(
  () => import('~/components/auth/register.vue'),
)
const AuthMagicLink = defineAsyncComponent(
  () => import('~/components/auth/magic-link.vue'),
)
const AuthError = defineAsyncComponent(
  () => import('~/components/auth/magic-link.vue'),
)

const authStore = useAuthModal()

// Map the view string from the store to the actual component
const authViews: Record<AuthView, any> = {
  login: AuthLogin,
  register: AuthRegister,
  'magic-link': AuthMagicLink,
  error: AuthError,
}

// Dynamic title based on the current view
const title = computed(() => {
  switch (authStore.view) {
    case 'login':
      return 'Sign in to your account'
    case 'register':
      return 'Create your account'
    case 'magic-link':
      return 'Sign in with a code'
    default:
      return 'Welcome'
  }
})

// Dynamic description
const description = computed(() => {
  switch (authStore.view) {
    case 'login':
      return 'Welcome back! Please sign in to continue.'
    case 'register':
      return 'Get started with our awesome platform.'
    case 'magic-link':
      return 'Enter your email to receive a code.'
    default:
      ''
  }
})

// Handle successful authentication
const handleSuccess = async () => {
  authStore.closeAuthModal()
  // Wait for the modal to close before navigating
  await nextTick()
  await navigateTo('/dashboard')
}
</script>
