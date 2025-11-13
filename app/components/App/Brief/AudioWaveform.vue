<template>
  <div class="w-full h-16 flex items-center bg-black/5 touch-none select-none">
    <div
      ref="container"
      class="relative w-full h-full overflow-hidden fade-mask cursor-grab active:cursor-grabbing"
      @mousedown="startDrag"
      @touchstart.passive="startDrag"
      @mousemove="onDrag"
      @touchmove.passive="onDrag"
      @mouseup="stopDrag"
      @touchend="stopDrag"
      @mouseleave="stopDrag"
    >
      <canvas
        ref="canvas"
        class="block w-full h-full pointer-events-none"
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useResizeObserver } from '@vueuse/core'
import { useBrief } from '~~/stores/brief'

const brief = useBrief()
const { briefData, currentTime, duration, playing } = storeToRefs(brief)

const container = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0

// --- Config ---
const barsPerSecond = 6
const barWidth = 3
const barGap = 2
const barRadius = 2
const totalBarWidth = barWidth + barGap

// Colors
const colorPlayed = '#FFFFFF'
const colorUpcoming = 'rgba(255,255,255,0.3)'
const colorPlayhead = '#FF5A3C'

// --- State ---
let smoothTime = 0
let lastTick = 0
let audioBufferPeaks: Float32Array | null = null

// --- Interaction State ---
let isDragging = false
let dragStartX = 0
let timeAtDragStart = 0
let wasPlayingBeforeDrag = false // Store state to resume later

// 1. Audio Decoding
async function decodeAndComputePeaks(url: string) {
  audioBufferPeaks = null
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`)
    const arrayBuffer = await resp.arrayBuffer()

    const AC = new (window.AudioContext || (window as any).webkitAudioContext)()
    const audioBuffer = await AC.decodeAudioData(arrayBuffer)
    const raw = audioBuffer.getChannelData(0)

    const samplesPerBar = Math.floor(audioBuffer.sampleRate / barsPerSecond)
    const totalBars = Math.floor(raw.length / samplesPerBar)

    const peaks = new Float32Array(totalBars)
    for (let i = 0; i < totalBars; i++) {
      let start = i * samplesPerBar
      let end = Math.min(start + samplesPerBar, raw.length)
      let max = 0
      for (let j = start; j < end; j++) {
        const val = Math.abs(raw[j])
        if (val > max) max = val
      }
      peaks[i] = max
    }

    const maxPeak = Math.max(...peaks) || 1
    for (let i = 0; i < peaks.length; i++) peaks[i] = peaks[i] / maxPeak

    audioBufferPeaks = peaks
    AC.close()
    renderFrame()
  } catch (e) {
    console.warn('[Waveform] Error:', e)
  }
}

// 2. Canvas Setup
function resizeCanvas() {
  if (!canvas.value || !container.value) return
  const rect = container.value.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.value.width = rect.width * dpr
  canvas.value.height = rect.height * dpr
  ctx = canvas.value.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
    canvas.value.style.width = `${rect.width}px`
    canvas.value.style.height = `${rect.height}px`
  }
  renderFrame()
}

// 3. Rendering
function renderFrame() {
  if (!ctx || !canvas.value) return

  const width = canvas.value.width / (window.devicePixelRatio || 1)
  const height = canvas.value.height / (window.devicePixelRatio || 1)
  ctx.clearRect(0, 0, width, height)

  const centerY = height / 2
  const centerX = width / 2

  ctx.fillStyle = colorPlayhead
  ctx.fillRect(centerX - 1, 8, 2, height - 16)

  if (!audioBufferPeaks || duration.value <= 0) return

  const totalWaveformPx = audioBufferPeaks.length * totalBarWidth
  const clampedTime = Math.max(0, Math.min(duration.value, smoothTime))
  const progress = clampedTime / duration.value

  const scrollOffset = totalWaveformPx * progress
  const startDrawX = centerX + 4 - scrollOffset
  const visiblePad = 100

  for (let i = 0; i < audioBufferPeaks.length; i++) {
    const x = startDrawX + i * totalBarWidth
    if (x + barWidth < -visiblePad) continue
    if (x > width + visiblePad) break

    const magnitude = audioBufferPeaks[i]
    const barHeight = Math.max(2, magnitude * (height * 0.8))
    const isPlayed = x + barWidth / 2 < centerX

    ctx.fillStyle = isPlayed ? colorPlayed : colorUpcoming
    roundRect(ctx, x, centerY - barHeight / 2, barWidth, barHeight, barRadius)
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

// 4. Loop
function loop() {
  // Only increment time if we are playing AND NOT dragging
  if (playing.value && !isDragging) {
    const now = performance.now()
    const delta = (now - lastTick) / 1000
    lastTick = now

    if (duration.value > 0) {
      smoothTime += delta
      if (smoothTime > duration.value) smoothTime = duration.value
    }

    const diff = Math.abs(smoothTime - (currentTime.value || 0))
    if (diff > 0.5) smoothTime = currentTime.value || 0
  } else {
    // Keep ticker fresh even when paused/dragging
    lastTick = performance.now()
  }
  renderFrame()
  raf = requestAnimationFrame(loop)
}

// --- 5. Drag Logic ---

function getX(e: MouseEvent | TouchEvent) {
  if ('touches' in e) return e.touches[0].clientX
  return (e as MouseEvent).clientX
}

function startDrag(e: MouseEvent | TouchEvent) {
  isDragging = true
  dragStartX = getX(e)
  timeAtDragStart = smoothTime

  // 1. Capture state
  wasPlayingBeforeDrag = playing.value

  // 2. Pause immediately so there is no audio while seeking
  if (playing.value) {
    playing.value = false
  }
}

const emit = defineEmits<{
  (e: 'scrub', time: number | null): void
}>()

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging) return

  const x = getX(e)
  const deltaX = x - dragStartX
  const pxPerSecond = barsPerSecond * totalBarWidth
  const deltaTime = deltaX / pxPerSecond

  const newTime = timeAtDragStart - deltaTime
  const clamped = Math.max(0, Math.min(duration.value, newTime))

  // Update visual state
  smoothTime = clamped
  renderFrame()

  // 2. EMIT THE TIME TO THE PARENT
  emit('scrub', clamped)
}

async function stopDrag() {
  if (!isDragging) return
  isDragging = false

  // Commit to store
  currentTime.value = smoothTime

  // 3. EMIT NULL TO SIGNAL END OF SCRUBBING
  emit('scrub', null)

  if (wasPlayingBeforeDrag) {
    setTimeout(() => {
      playing.value = true
    }, 10)
  }
}

// --- Watchers ---

watch(
  () => briefData.value?.audioUrl,
  (newUrl) => {
    if (newUrl) decodeAndComputePeaks(newUrl)
  },
  { immediate: true },
)

watch(playing, (isPlaying) => {
  if (isPlaying) {
    lastTick = performance.now()
    if (!isDragging) smoothTime = currentTime.value || 0
    cancelAnimationFrame(raf)
    loop()
  } else {
    // Even when paused, we run the loop (it just won't increment time)
    // This ensures renderFrame() happens if resize/seek occurs
    cancelAnimationFrame(raf)
    loop()
  }
})

watch(currentTime, (newVal) => {
  // Sync store -> visual
  // Ignore if WE are the ones dragging
  if (!isDragging && (Math.abs(smoothTime - newVal) > 0.5 || !playing.value)) {
    smoothTime = newVal
    renderFrame()
  }
})

onMounted(() => {
  resizeCanvas()
  useResizeObserver(container, resizeCanvas)
  loop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
})
</script>

<style scoped>
.fade-mask {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 15%,
    black 85%,
    transparent 100%
  );
}
</style>
