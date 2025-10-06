<template>
  <UPopover v-if="portfolioMembers?.length" mode="hover">
    <div class="flex cursor-pointer items-center gap-1">
      <span>{{ portfolioMembers.length }}</span>
      <UIcon name="i-lucide-users" class="text-neutral-500" />
    </div>
    <template #content>
      <div class="w-72 px-4 py-2">
        <ul class="divide-neutral-100 dark:divide-white/10 divide-y">
          <li
            v-for="portfolioMember in portfolioMembers"
            :key="portfolioMember.id"
            class="py-2"
          >
            <div class="flex items-center gap-2">
              <UAvatar
                :src="portfolioMember.portfolio.logo || undefined"
                size="2xs"
                :alt="portfolioMember.portfolio.name + ' logo'"
              />
              <span class="flex-1 text-sm font-medium">
                {{ portfolioMember.portfolio.name }}
              </span>
              <span class="text-neutral-500 text-xs capitalize">
                {{ portfolioMember.role }}
              </span>
            </div>
            <div
              v-if="portfolioMember.role !== 'owner'"
              class="p-2 pb-0 pl-2.5"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-fluent-arrow-enter-24-filled"
                  class="flex-shrink-0 scale-x-[-1] text-sm"
                />
                <p class="text-neutral-500 text-xs">Owned by</p>
                <UAvatar
                  :src="
                    getPortfolioOwner(portfolioMember.portfolio.ownerId)
                      .avatarUrl || undefined
                  "
                  size="3xs"
                  :alt="
                    getPortfolioOwner(portfolioMember.portfolio.ownerId).name
                  "
                />
                <p class="text-xs font-medium">
                  {{
                    getPortfolioOwner(portfolioMember.portfolio.ownerId).name
                  }}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </UPopover>
  <span v-else>-</span>
</template>

<script lang="ts" setup>
import type { User } from '@@/types/database'

interface PortfolioMember {
  id: string
  portfolioId: string
  userId: string
  role: string
  createdAt: string
  updatedAt: string
  portfolio: {
    id: string
    name: string
    ownerId: string
    logo: string
    slug: string
    createdAt: string
    updatedAt: string
  }
}

const props = defineProps<{
  portfolioMembers?: PortfolioMember[]
  users?: User[]
}>()

function getPortfolioOwner(ownerId: string): {
  name: string
  email: string
  avatarUrl: string
} {
  if (!ownerId || !props.users?.length)
    return { name: 'Unknown', email: 'Unknown', avatarUrl: 'Unknown' }
  const owner = props.users.find((user) => user.id === ownerId)
  return {
    name: owner?.name || 'Unknown',
    email: owner?.email || 'Unknown',
    avatarUrl: owner?.avatarUrl || 'Unknown',
  }
}
</script>
