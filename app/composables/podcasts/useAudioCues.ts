// composables/useAudioCues.ts
import { onMounted, onBeforeUnmount } from 'vue'

type Cue = { at: number; components: any[] }

// Guard: keep cues sorted
function sortCues(cues: Cue[]) {
  cues.sort((a, b) => a.at - b.at)
  return cues
}

export function useAudioCues(audio: HTMLAudioElement, rawCues: Cue[]) {
  const cues = sortCues(rawCues.slice())
  let idx = 0
  const EPS = 0.06 // 60ms grace to avoid floating-point misses

  const findIndexFor = (t: number) => {
    for (let i = 0; i < cues.length; i++) if (cues[i].at > t + EPS) return i
    return cues.length
  }

  const fireDue = (t: number) => {
    // fire all cues whose at <= current time (+EPS)
    while (idx < cues.length && cues[idx].at <= t + EPS) {
      // DEBUG: uncomment if needed
      // console.log('[Cues] firing', cues[idx].at, cues[idx])
      window.dispatchEvent(
        new CustomEvent('podcast-cue', { detail: cues[idx] }),
      )
      idx++
    }
  }

  const onPlay = () => {
    // reset idx for current position in case user scrubbed before play
    idx = findIndexFor(audio.currentTime)
    // try to fire immediately (handles cues at ~0s)
    fireDue(audio.currentTime)
  }

  const onTimeUpdate = () => {
    fireDue(audio.currentTime)
  }

  const onSeeked = () => {
    idx = findIndexFor(audio.currentTime)
    // also fire immediately if we scrubbed just past a cue (common UX)
    fireDue(audio.currentTime)
  }

  const onLoaded = () => {
    idx = findIndexFor(0)
  }

  onMounted(() => {
    audio.addEventListener('play', onPlay)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('seeked', onSeeked)
    audio.addEventListener('loadedmetadata', onLoaded)
  })

  onBeforeUnmount(() => {
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('timeupdate', onTimeUpdate)
    audio.removeEventListener('seeked', onSeeked)
    audio.removeEventListener('loadedmetadata', onLoaded)
  })
}
