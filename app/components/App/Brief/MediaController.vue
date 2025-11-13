<template>
  <div
    @click="openModal"
    class="h-12 relative flex w-full max-w-[calc(448px+60px)] items-center justify-between rounded-full border-1 dark:border-black-800 dark:bg-black-500/10 p-1 shadow-lg select-none backdrop-blur-md overflow-hidden"
  >
    <Button class="rounded-full" variant="default" @click.stop="toggle">
      <Icon :name="playing ? 'i-lucide-pause' : 'i-lucide-play'" />
    </Button>

    <div class="flex items-center gap-4 flex-1 justify-center">
      <AudioWaveform :playing="playing" @scrub="(t) => (scrubTime = t)" />

      <span
        class="tabular-nums bg-neutral-800 px-2 py-0 rounded-full text-sm text-orange-500"
      >
        {{ displayTime }}
      </span>
    </div>

    <Icon
      @click.stop="handleCloseBrief"
      name="i-lucide-x"
      class="size-5 opacity-50"
    />
  </div>
</template>

<script setup lang="ts">
import AudioWaveform from '@/components/App/Brief/AudioWaveform.vue'
import { useBrief } from '@@/stores/brief'
import { useGlobalDrawerDialogStore } from '@@/stores/globalDrawerDialog'
import { Button } from '@/components/ui/button'

const modal = useGlobalDrawerDialogStore()
const brief = useBrief()
const { playing, currentTime, duration, showBriefNavElement } =
  storeToRefs(brief)

const scrubTime = ref<number | null>(null)

// 4. Create a computed property for clean logic
// Priority: Scrubbing -> Playing -> Duration
const displayTime = computed(() => {
  // If we are scrubbing, show that time immediately
  if (scrubTime.value !== null) return mmss(scrubTime.value)

  // If playing, show current progress
  if (playing.value) return mmss(currentTime.value)

  // If paused and idle, show total duration
  return mmss(duration.value)
})

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
