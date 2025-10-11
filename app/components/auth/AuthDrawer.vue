<template>
  <Drawer v-model:open="authStore.open">
    <DrawerContent class="padding-env-bottom overflow-hidden">
      <div class="absolute -top-10 inset-0 -z-10 flex justify-center">
        <div class="linear-gradient-layer absolute -z-1"></div>
        <div class="linear-gradient-layer-bottom absolute -z-1"></div>
        <div class="radial-gradient-layer absolute -z-1"></div>
      </div>
      <div class="mx-auto w-full max-w-sm space-y-8">
        <div class="gradient-header relative w-full">
          <div class="flex flex-col items-center justify-center p-4 text-white">
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
          <component :is="authViews[authStore.view]" @success="handleSuccess" />
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

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { useAuthModal, type AuthView } from '~~/stores/authModal'

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

<style scoped>
.linear-gradient-layer {
  height: 100vh; /* Example: make it fill the viewport height */
  width: 100vw; /* Example: make it fill the viewport width */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: sans-serif;
  font-size: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background-image: linear-gradient(
    to bottom,
    #ff7733 0%,
    /* Lighter Orange */ #ff5000 20%,
    /* Main Orange-Red */ #331100 100% /* Very Dark Brown/Red (Near-Black) */
  );
}

.linear-gradient-layer-bottom {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: sans-serif;
  font-size: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background-image: linear-gradient(
    to top,
    /* Correct direction */ black 0%,
    /* Start with black at the bottom */ transparent 100%
      /* End with transparent at the top */
  );
}

.radial-gradient-layer {
  height: 100vh; /* Example: make it fill the viewport height */
  width: 300%; /* Example: make it fill the viewport width */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: sans-serif;
  font-size: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background-image:
    /* Layer 1: The vibrant radial glow, slightly off-center top */ radial-gradient(
    circle at 50% 50%,
    /* Adjust position: 50% horizontal, 10% from top */ #000 0%,
    /* A bright, medium-violet-red at the center */ #000000 20%,
    /* A slightly darker purple as it spreads */ transparent 70%
      /* Fades to transparent relatively quickly */
  );
}
</style>
