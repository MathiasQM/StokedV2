<!-- components/podcast/PodcastPlayer.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import PodcastStage from './Stage.vue' // or './PodcastStage.vue' – match your filename

const props = defineProps<{
  audioSrc: string
  cues: { at: number; components: { type: string; params: any }[] }[]
}>()

const audioRef = ref<HTMLAudioElement | null>(null)

let idx = 0
const EPS = 0.06 // 60ms grace
const cues = props.cues.slice().sort((a, b) => a.at - b.at)

const findIndexFor = (t: number) => {
  for (let i = 0; i < cues.length; i++) if (cues[i].at > t + EPS) return i
  return cues.length
}

const fireDue = (t: number) => {
  while (idx < cues.length && cues[idx].at <= t + EPS) {
    console.log('[Player/Dispatch] firing', cues[idx].at, cues[idx])
    window.dispatchEvent(new CustomEvent('podcast-cue', { detail: cues[idx] }))
    idx++
  }
}

const onPlay = () => {
  console.log('[Player] play')
  console.log(props.cues)
  if (!audioRef.value) return
  idx = findIndexFor(audioRef.value.currentTime)
  fireDue(audioRef.value.currentTime) // catch any near-0s cue
}

const onPause = () => console.log('[Player] pause')
const onTime = () => {
  if (!audioRef.value) return
  // console.log('[Player] timeupdate', audioRef.value.currentTime)
  fireDue(audioRef.value.currentTime)
}
const onSeeked = () => {
  if (!audioRef.value) return
  idx = findIndexFor(audioRef.value.currentTime)
  console.log('[Player] seeked -> idx', idx)
  fireDue(audioRef.value.currentTime)
}
const onLoaded = () => {
  if (!audioRef.value) return
  console.log('[Player] loadedmetadata, duration=', audioRef.value.duration)
  idx = findIndexFor(0)
}

onMounted(() => {
  const a = audioRef.value!
  a.addEventListener('play', onPlay)
  a.addEventListener('pause', onPause)
  a.addEventListener('timeupdate', onTime)
  a.addEventListener('seeked', onSeeked)
  a.addEventListener('loadedmetadata', onLoaded)
})

onBeforeUnmount(() => {
  const a = audioRef.value
  if (!a) return
  a.removeEventListener('play', onPlay)
  a.removeEventListener('pause', onPause)
  a.removeEventListener('timeupdate', onTime)
  a.removeEventListener('seeked', onSeeked)
  a.removeEventListener('loadedmetadata', onLoaded)
})
</script>

<template>
  <div class="space-y-4">
    <audio
      ref="audioRef"
      :src="audioSrc"
      controls
      preload="auto"
      class="w-full"
    />
    <PodcastStage />
  </div>
</template>
