<template>
  <audio ref="audio" class="hidden" preload="metadata"></audio>
</template>

<script setup lang="ts">
import { useBrief } from '@@/stores/brief'

const brief = useBrief()
const audio = ref<HTMLAudioElement>()

onMounted(() => {
  if (audio.value) brief.initAudio(audio.value)
})
</script>
