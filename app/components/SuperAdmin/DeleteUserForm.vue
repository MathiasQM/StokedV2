<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <UAvatar :src="user.avatarUrl || undefined" :alt="user.name" size="lg" />
      <div>
        <p class="text-sm font-bold">{{ user.name }}</p>
        <p class="text-gray-500 text-sm">{{ user.email }}</p>
      </div>
    </div>
    <div class="bg-neutral-100 dark:bg-neutral-950 space-y-4 rounded-md p-4">
      <p class="text-neutral-500 text-sm">
        This action will delete the user from the platform and all associated
        data. {{ user.name }} is a part of the following portfolios:
      </p>
      <div
        v-for="portfolioMember in user.portfolioMembers"
        :key="portfolioMember.id"
        class="flex items-center gap-3"
      >
        <UAvatar
          :src="portfolioMember.portfolio.logo || undefined"
          size="sm"
          :alt="portfolioMember.portfolio.name + ' logo'"
        />
        <div>
          <p class="text-sm font-medium">
            {{ portfolioMember.portfolio.name }}
          </p>
          <p class="text-neutral-500 text-xs">
            <span class="capitalize">{{ portfolioMember.role }}</span>
            {{
              portfolioMember.role === 'owner'
                ? ''
                : `(Owner: ${getPortfolioOwnerName(portfolioMember.portfolio.ownerId)})`
            }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex w-full justify-end gap-2">
      <UButton
        variant="soft"
        color="orange"
        label="Cancel"
        @click="$emit('cancel')"
      />
      <UButton
        variant="soft"
        color="error"
        label="Delete User"
        :loading="loading"
        @click="deleteUser"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { OAuthAccounts, User } from '@@/types/database'
import type { SanitizedUser } from '@@/server/utils/auth'

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

interface ExtendedUser extends User {
  oauthAccounts?: OAuthAccounts[]
  portfolioMembers?: PortfolioMember[]
}

const props = defineProps<{
  user: ExtendedUser
  users?: User[]
}>()

const emit = defineEmits(['user-deleted', 'cancel'])
const loading = ref(false)
const toast = useToast()

const getPortfolioOwnerName = (ownerId: string) => {
  if (!ownerId || !props.users?.length) return 'Unknown'
  const owner = props.users.find((user) => user.id === ownerId)
  return owner?.name || 'Unknown'
}

const deleteUser = async () => {
  loading.value = true
  try {
    await $fetch<SanitizedUser>('/api/super-admin/users', {
      method: 'DELETE',
      body: { userId: props.user.id },
    })
    toast.add({
      title: 'User deleted successfully',
      description: 'The user has been deleted',
      color: 'success',
    })
    emit('user-deleted')
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete user',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
