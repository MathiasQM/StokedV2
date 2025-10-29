<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

type GreetingKey = 'night' | 'morning' | 'day' | 'evening'

const props = withDefaults(
  defineProps<{
    /** Optional: user's name to include in the greeting */
    name?: string
    /** Optional: override greeting text */
    messages?: Partial<Record<GreetingKey, string>>
    /** Optional: hour ranges (24h). Each is [startHour, endHour) */
    ranges?: {
      night?: [number, number]
      morning?: [number, number]
      day?: [number, number]
      evening?: [number, number]
    }
    /** Optional: how often to re-check time (ms) */
    refreshMs?: number
  }>(),
  {
    name: '',
    messages: () => ({
      night: 'Good night',
      morning: 'Good morning',
      day: 'Good afternoon',
      evening: 'Good evening',
    }),
    // Defaults: night 22–05, morning 05–11, day 11–17, evening 17–22
    ranges: () => ({
      night: [22, 24],
      morning: [5, 11],
      day: [11, 17],
      evening: [17, 22],
    }),
    refreshMs: 60_000, // update every minute
  },
)

/** current hour on client; avoid SSR mismatch by updating onMounted */
const hour = ref<number | null>(null)
let timer: number | undefined

function updateHour() {
  const now = new Date()
  hour.value = now.getHours()
}

onMounted(() => {
  updateHour()
  timer = window.setInterval(updateHour, props.refreshMs)
})
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

/** Helper: check if an hour falls in a half-open interval [start,end) with wrap-around (e.g., 22–05) */
function inRange(h: number, [start, end]: [number, number]) {
  return start < end ? h >= start && h < end : h >= start || h < end
}

const period = computed<GreetingKey | null>(() => {
  if (hour.value === null) return null
  const h = hour.value

  if (inRange(h, props.ranges.night!)) return 'night'
  if (inRange(h, props.ranges.morning!)) return 'morning'
  if (inRange(h, props.ranges.day!)) return 'day'
  if (inRange(h, props.ranges.evening!)) return 'evening'

  // Fallback (shouldn’t happen if ranges cover 24h)
  return 'day'
})

const greeting = computed(() => {
  if (!period.value) return '' // during SSR or first paint
  const base = props.messages[period.value]
  return props.name
    ? `${base}, ${props.name.slice(0, 1).toUpperCase()}${props.name.slice(1)}`
    : base
})
</script>

<template>
  <div class="text-xl font-black">
    <ClientOnly>
      <span v-if="greeting">{{ greeting }}</span>
      <template #fallback>
        <span>Hey</span>
      </template>
    </ClientOnly>
  </div>
</template>
