<script setup lang="ts">
const props = defineProps({
  size: {
    type: String as PropType<'xs' | 'sm' | 'md' | 'lg' | 'xl'>,
    required: false,
    default: 'md',
  },
})
</script>
<template>
  <div class="relative flex w-full gap-2">
    <div
      class="gradient relative flex h-6 min-w-6 items-center justify-center rounded-full text-sm text-[white] transition-all hover:scale-[102%]"
      :class="`size-${props.size}`"
    >
      <button
        class="text-md flex h-[calc(100%-2px)] w-[calc(100%-2px)] cursor-pointer items-center justify-center rounded-full bg-orange-500 p-2 font-semibold whitespace-nowrap"
      >
        <slot />
      </button>
    </div>
  </div>
</template>

<style scoped>
.size-xs {
  width: 40px;
  height: 40px;
}
.size-sm {
  width: 80px;
  height: 40px;
}
.size-md {
  width: 80px;
  height: 40px;
}
.size-lg {
  width: 80px;
  height: 40px;
}
.size-xl {
  width: 100%;
  height: 40px;
}
.gradient {
  background: linear-gradient(
    50deg,
    rgba(255, 255, 255, 0.5) 30%,
    rgba(255, 255, 255, 0.7) 35%,
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 255, 255, 0.8) 55%,
    rgba(255, 255, 255, 0.5) 70%
  );
}
</style>
