<template>
  <ul class="space-y-1">
    <template v-if="isAccountSettings">
      <li v-for="link in accountLinks" :key="link.to">
        <AppSidebarLink v-bind="link" />
      </li>
    </template>
    <template v-else>
      <li v-for="link in portfolioNavLinks" :key="link.to">
        <AppSidebarLink v-bind="link" />
      </li>
      <USeparator class="my-4" />
      <li v-for="link in portfolioSettingsLinks" :key="link.to">
        <AppSidebarLink v-bind="link" />
      </li>
    </template>
  </ul>
</template>

<script lang="ts" setup>
const props = defineProps<{
  isAccountSettings: boolean
  portfolioSlug?: string
}>()

const accountLinks = [
  {
    label: 'Account Settings',
    icon: 'i-lucide-settings',
    to: '/account',
  },
]

const portfolioNavLinks = computed(() => [
  {
    label: 'Home',
    icon: 'i-lucide-home',
    to: `/dashboard/${props.portfolioSlug}`,
  },
  {
    label: 'Posts',
    icon: 'i-lucide-file-text',
    to: `/dashboard/${props.portfolioSlug}/posts`,
  },
])

const portfolioSettingsLinks = computed(() => [
  {
    label: 'Workspace Settings',
    icon: 'i-lucide-settings',
    to: `/dashboard/${props.portfolioSlug}/settings`,
  },
  {
    label: 'Workspace Members',
    icon: 'i-lucide-users',
    to: `/dashboard/${props.portfolioSlug}/settings/members`,
  },
  {
    label: 'Billing',
    icon: 'i-lucide-credit-card',
    to: `/dashboard/${props.portfolioSlug}/settings/billing`,
  },
])
</script>
