<template>
  <header>
    <AppPortfolioDropdown />
    <AppSidebarLink
      key="Market"
      v-bind="{
        label: 'Market',
        icon: 'i-lucide-globe',
        to: `/market`,
      }"
      class="mt-5"
    />
  </header>

  <AppSidebarContent class="mt-2">
    <AppSidebarGroup>
      <AppSidebarLink v-for="link in links" :key="link.to" v-bind="link" />
      <template v-if="isPortfolioOwner && portfolios.length > 0">
        <USeparator class="my-4" />
        <AppSidebarLink v-for="link in settings" :key="link.to" v-bind="link" />
      </template>
    </AppSidebarGroup>
  </AppSidebarContent>
</template>

<script lang="ts" setup>
import { usePortfolio } from '~/composables/usePortfolio'

const { isPortfolioOwner, currentPortfolio, portfolios } = usePortfolio()

const links = computed(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-chart-spline',
    to: `/dashboard/${currentPortfolio.value?.slug}` || '',
    requirePortfolio: true,
  },
  {
    label: 'Posts',
    icon: 'i-lucide-file-text',
    to: `/dashboard/${currentPortfolio.value.slug}/posts`,
  },
])

const settings = computed(() => [
  {
    label: 'Portfolio Settings',
    icon: 'i-lucide-settings',
    to: `/dashboard/${currentPortfolio.value?.slug}/settings` || '',
    requirePortfolio: true,
  },
  {
    label: 'Portfolio Members',
    icon: 'i-lucide-users',
    to: `/dashboard/${currentPortfolio.value?.slug}/settings/members` || '',
    requirePortfolio: true,
  },
])
</script>
