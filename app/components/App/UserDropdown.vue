<template>
  <UDropdownMenu
    v-if="loggedIn"
    class="hover:bg-none"
    :items="items"
    :ui="{
      content: 'w-[240px]',
    }"
    :content="{
      align: 'start',
    }"
  >
    <UButton
      block
      variant="ghost"
      class="w-auto justify-normal text-left hover:bg-zinc-200/80 hover:bg-none md:w-full dark:hover:bg-white/10"
    >
      <UAvatar
        :src="user?.avatarUrl || ''"
        :alt="user?.name"
        size="xs"
        class="ring-2 ring-neutral-200 dark:ring-white/10"
      />
      <div class="hidden flex-1 items-center gap-2 md:flex">
        <p class="text-sm text-white first-letter:uppercase">
          {{ user?.name }}
        </p>
      </div>
      <UIcon class="hidden text-white md:flex" name="i-lucide-chevron-up" />
    </UButton>
    <template #profile>
      <div class="flex items-center gap-2">
        <UAvatar
          :src="user?.avatarUrl || ''"
          :alt="user?.name"
          class="ring-2 ring-neutral-200 dark:ring-white/10"
        />
        <div class="flex-1">
          <p :style="{ fontWeight: 500 }" class="text-sm">{{ user?.name }}</p>
          <p
            class="text-xs text-zinc-500 dark:text-zinc-400"
            :style="{ fontWeight: 400 }"
          >
            {{ user?.email }}
          </p>
        </div>
      </div>
    </template>
  </UDropdownMenu>
  <UButton
    v-else
    variant="outline"
    class="rounded-full md:rounded-md md:w-full md:aspect-auto md:h-10 aspect-square"
    @click="authStore.openAuthModal('login')"
  >
    <Icon name="i-lucide-user" />
    {{ !isMobile ? 'Login / Signup' : '' }}
  </UButton>
  <UModal
    v-model:open="feedbackModal"
    title="Need help?"
    description="Have a question or need assistance? We're here to help!"
  >
    <template #body>
      <AppFeedbackForm @close="feedbackModal = false" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { usePortfolio } from '@/composables/usePortfolio'
import { useAuthModal } from '~~/stores/authModal'

const isMobile = useIsMobile()
const authStore = useAuthModal()
const { loggedIn } = useUserSession()

const breakpoints = useBreakpoints(breakpointsTailwind)
const smallerThanMd = breakpoints.smaller('md')
const { user } = useUserSession()
const { logout } = useAuth()
const mobileMenu = useState('mobileMenu')
const isSuperAdmin = computed(() => user.value?.superAdmin)
const feedbackModal = ref(false)

const { currentPortfolio, portfolios, isPortfolioOwner } = usePortfolio()

async function signOut() {
  await logout()
  await navigateTo('/')
}
const items = computed(() => [
  [
    {
      slot: 'profile',
      label: user?.value?.name,
      avatar: {
        src: user?.value?.avatarUrl || '',
        alt: user?.value?.name,
      },
      type: 'label',
      onSelect: () => {
        mobileMenu.value = false
      },
    },
  ],
  [
    {
      label: 'Account Settings',
      icon: 'i-lucide-user-cog',
      to: '/account',
      onSelect: () => {
        mobileMenu.value = false
      },
    },
  ],
  // [
  //   {
  //     label: 'Theme',
  //     icon: 'i-lucide-moon',
  //     children: [
  //       [
  //         {
  //           label: 'Light',
  //           icon: 'i-lucide-sun',
  //           onSelect: () => {
  //             setColorMode('light')
  //             mobileMenu.value = false
  //           },
  //         },
  //         {
  //           label: 'Dark',
  //           icon: 'i-lucide-moon',
  //           onSelect: () => {
  //             setColorMode('dark')
  //             mobileMenu.value = false
  //           },
  //         },
  //       ],
  //       [
  //         {
  //           label: 'System',
  //           icon: 'i-lucide-monitor',
  //           onSelect: () => {
  //             setColorMode('system')
  //             mobileMenu.value = false
  //           },
  //         },
  //       ],
  //     ],
  //   },
  // ],
  ...(smallerThanMd.value && portfolios.value.length > 0 && isPortfolioOwner
    ? [
        [
          {
            label: 'Portfolio Settings',
            icon: 'i-lucide-settings-2',
            to: `/dashboard/${currentPortfolio.value.slug}/settings`,
            onSelect: () => {
              mobileMenu.value = false
            },
          },
          {
            label: 'Portfolio Members',
            icon: 'i-lucide-users',
            to: `/dashboard/${currentPortfolio.value.slug}/settings/members`,
            onSelect: () => {
              mobileMenu.value = false
            },
          },
        ],
      ]
    : []),
  [
    {
      label: 'Support',
      icon: 'i-lucide-life-buoy',
      onSelect: () => {
        feedbackModal.value = true
        mobileMenu.value = false
      },
    },
  ],
  ...(isSuperAdmin.value
    ? [
        [
          {
            label: 'Super Admin',
            icon: 'i-lucide-shield',
            to: '/dashboard/super-admin',
          },
        ],
      ]
    : []),
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      onSelect: signOut,
      color: 'error' as const,
    },
  ],
])

const colorMode = useColorMode()

function setColorMode(mode: string) {
  colorMode.preference = mode
}
</script>
