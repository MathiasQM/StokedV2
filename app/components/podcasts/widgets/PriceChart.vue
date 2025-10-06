<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  ticker: string
  range: '1D' | '5D' | '1M' | '6M' | '1Y'
}>()
const cvs = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!cvs.value) return
  const ctx = cvs.value.getContext('2d')!
  const w = (cvs.value.width = cvs.value.clientWidth * devicePixelRatio)
  const h = (cvs.value.height = 120 * devicePixelRatio)
  // mock data
  const N = 60,
    data = Array.from(
      { length: N },
      (_, i) => Math.sin(i / 8) + Math.random() * 0.3,
    )
  const min = Math.min(...data),
    max = Math.max(...data)
  const x = (i: number) => (i / (N - 1)) * w
  const y = (v: number) => h - ((v - min) / (max - min)) * h
  ctx.lineWidth = 2 * devicePixelRatio
  ctx.beginPath()
  data.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))))
  ctx.strokeStyle = '#7dd3fc' // tweak later
  ctx.stroke()
})
</script>

<template>
  <div class="rounded-2xl bg-zinc-800/60 p-4">
    <div class="mb-2 flex items-center justify-between">
      <h3 class="font-semibold">{{ ticker }}</h3>
      <span class="text-xs opacity-70">{{ range }}</span>
    </div>
    <canvas ref="cvs" class="h-[120px] w-full"></canvas>
  </div>
</template>
