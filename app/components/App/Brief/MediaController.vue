<template>
  <div
    @click="openModal"
    class="h-12 relative flex w-full max-w-[calc(448px+60px)] items-center justify-between rounded-full border-1 dark:border-black-800 dark:bg-black-500/10 p-1 shadow-lg select-none backdrop-blur-md overflow-hidden"
  >
    <Button class="rounded-full" variant="default" @click.stop="toggle">
      <Icon :name="playing ? 'i-lucide-pause' : 'i-lucide-play'" />
    </Button>
    <span class="tabular-nums"
      >{{ mmss(currentTime) }} / {{ mmss(duration) }}</span
    >
    <Icon
      @click.stop="handleCloseBrief"
      name="i-lucide-x"
      class="size-5 opacity-50"
    />
  </div>
</template>

<script setup lang="ts">
import { useBrief } from '@@/stores/brief'
import { useGlobalDrawerDialogStore } from '@@/stores/globalDrawerDialog'
import { Button } from '@/components/ui/button'

const modal = useGlobalDrawerDialogStore()
const brief = useBrief()
const { playing, currentTime, duration, showBriefNavElement } =
  storeToRefs(brief)

function toggle() {
  playing.value = !playing.value
}

function openModal() {
  modal.openModal({
    mode: 'drawer',
    title: '',
    description: '',
    componentName: 'BriefStage',
    footerText: 'Remember, this is not financial advice...',
    actions: [],
    backdropClose: true,
    escClose: true,
  })
}

function mmss(sec: number) {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

const handleCloseBrief = () => {
  showBriefNavElement.value = false
  playing.value = false
}
</script>
