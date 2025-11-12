<template>
  <div class="">
    <AppLayoutsNavLink v-for="link in links" :key="link.to" v-bind="link" />
  </div>
</template>

<script lang="ts" setup>
const links = [
  {
    label: 'Exit',
    icon: 'i-lucide-chevron-left',
    to: `/dashboard`,
  },
  {
    label: 'Users',
    icon: 'i-lucide-users',
    to: `/dashboard/super-admin`,
  },
  {
    label: 'Portfolios',
    icon: 'i-lucide-users',
    to: `/dashboard/super-admin/portfolios`,
  },
  {
    label: 'Stripe Plans',
    icon: 'i-lucide-credit-card',
    to: '/dashboard/super-admin/stripe-plans',
  },
  {
    label: 'Feedback Submissions',
    icon: 'i-lucide-message-circle',
    to: '/dashboard/super-admin/feedback-submissions',
  },
  {
    label: 'Newsletter Subscribers',
    icon: 'i-lucide-mail',
    to: '/dashboard/super-admin/newsletter-subscribers',
  },
]
</script>
