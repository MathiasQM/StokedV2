<template>
  <AppContainer disablePaddingx title="Workspace Members">
    <template #actions>
      <UButton
        color="orange"
        label="Invite Member"
        @click="newMemberModal = true"
      />
    </template>
    <UModal
      size="xl"
      v-model:open="newMemberModal"
      prevent-close
      :title="`Invite a new member to ${currentPortfolio?.name}`"
      description="We will email them a link to join your portfolio. Invitations are valid for 7 days."
    >
      <template #body>
        <UForm
          class="space-y-4"
          :state="state"
          :schema="schema"
          @submit="onSubmit"
        >
          <UFormField required label="Member email" name="email">
            <UInput
              v-model="state.email"
              placeholder="john@doe.com"
              class="w-full"
              size="lg"
            />
          </UFormField>
          <UFormField required label="Role" name="role">
            <USelectMenu
              v-model="state.role"
              :items="roleOptions"
              value-key="id"
              class="w-full"
              size="lg"
              :search-input="false"
            />
          </UFormField>
          <UButton
            :loading="loading"
            color="orange"
            type="submit"
            block
            size="lg"
            label="Send invitation"
          />
        </UForm>
      </template>
    </UModal>
    <div class="mx-auto max-w-5xl space-y-12">
      <AppPortfolioMembers />
      <AppPortfolioInvites />
    </div>
  </AppContainer>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types'
import type { z } from 'zod'
// import { invitePortfolioMemberSchema } from '~~/shared/validations/portfolio'
import { UserRole } from '@@/constants'
import { usePortfolio } from '@/composables/usePortfolio'

const { currentPortfolio, inviteMember, loading } = usePortfolio()
const toast = useToast()

const { user } = useUserSession()
const newMemberModal = ref(false)
const state = reactive({
  email: '',
  role: UserRole.MEMBER,
})

const roleOptions = [
  { label: 'Member', id: UserRole.MEMBER },
  { label: 'Admin', id: UserRole.ADMIN },
  { label: 'Owner', id: UserRole.OWNER },
]

// const schema = invitePortfolioMemberSchema.refine(
//   (data) => data.email !== user.value?.email,
//   {
//     message: 'You cannot invite yourself',
//   },
// )

const onSubmit = async (event: FormSubmitEvent<z.infer<typeof schema>>) => {
  loading.value = true
  try {
    await inviteMember(event.data.email, event.data.role)
    toast.add({
      title: 'Member invited successfully',
      description: `We have sent an invitation to ${event.data.email}`,
      color: 'success',
    })
    newMemberModal.value = false
    await refreshNuxtData('portfolio-invites')
  } catch (error) {
    toast.add({
      title: 'Error inviting member',
      description: (error as any).data.message,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
