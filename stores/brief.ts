// stores/brief.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, onMounted } from 'vue'
import { useAsyncData, useNuxtApp } from '#imports'
import { useMediaControls } from '@vueuse/core'

export const useBrief = defineStore('brief', () => {
  const { $dayjs } = useNuxtApp()

  const selectedDate = ref($dayjs().format('YYYY-MM-DD'))
  const audioRef = ref<HTMLAudioElement | null>(null)
  const showBriefNavElement = ref(false)

  const cacheKey = computed(() => `brief:${selectedDate.value}`)

  const {
    data: briefData,
    pending,
    refresh,
    error,
  } = useAsyncData(
    cacheKey.value,
    () =>
      $fetch('/api/brief', {
        method: 'POST',
        body: { date: $dayjs(selectedDate.value).startOf('day').toISOString() },
      }),
    { watch: [selectedDate], immediate: true },
  )

  // Make src reactive for vueuse
  const src = computed(() => briefData.value?.audioUrl || '')

  // Hook controls to the SINGLE audio element.
  const { playing, currentTime, duration, volume } = useMediaControls(
    audioRef,
    { src },
  )

  // Optional: when we get a new src, reset time (or keep progress if same src)
  watch(src, (s, prev) => {
    if (!audioRef.value) return
    if (s && s !== prev) {
      // Ensure the element loads new source before play
      audioRef.value.load()
      // Decide if you want to autoplay the fresh brief:
      // play()
    }
  })

  function initAudio(el: HTMLAudioElement) {
    if (audioRef.value === el) return
    audioRef.value = el
  }

  function setDate(d: string | Date) {
    selectedDate.value = $dayjs(d).format('YYYY-MM-DD')
  }

  return {
    // data
    selectedDate,
    briefData,
    pending,
    error,
    showBriefNavElement,
    // audio state
    playing,
    currentTime,
    duration,
    volume,
    // actions
    setDate,
    refresh,
    initAudio,
  }
})
