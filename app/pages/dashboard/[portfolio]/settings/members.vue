<template>
  <AppContainer title="Workspace Members">
    <AppPortfolioSettingsMembers />
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
