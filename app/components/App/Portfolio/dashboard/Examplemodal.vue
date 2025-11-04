<template>
  <div class="w-full flex flex-col justify-center h-32 items-center gap-3">
    <CustomButtonsShiny @click="openModal" variant="pill"
      >News</CustomButtonsShiny
    >
  </div>
</template>

<script setup lang="ts">
import { useGlobalDrawerDialogStore } from '~~/stores/globalDrawerDialog'

import { Check } from 'lucide-vue-next'

const modal = useGlobalDrawerDialogStore()

function openModal() {
  modal.openModal({
    mode: 'drawer',
    title: 'Invite user',
    description: 'Send an invitation with proper permissions.',
    componentName: 'CustomButtonsShiny',
    componentProps: { buttonText: 'Send Invite' },
    footerText: 'You can change this later in Settings.',
    actions: [
      {
        key: 'cancel',
        type: 'secondary',
        label: 'Cancel',
        closeOnClick: true,
      },
      {
        key: 'confirm',
        type: 'primary',
        label: 'Send invite',
        icon: Check,
        closeOnClick: false,
        run: async ({ close }) => {
          await new Promise((r) => setTimeout(r, 400))
          close()
        },
      },
    ],
    backdropClose: true,
    escClose: true,
  })
}
</script>
