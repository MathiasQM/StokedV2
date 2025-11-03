<script setup lang="ts">
const props = defineProps<{
  enableDots?: boolean
  enableBorderFlare?: boolean
  disableBorders?: boolean
}>()

const isMobile = useIsMobile()
</script>

<template>
  <Transition name="fade" mode="out-in">
    <div
      class="card-container relative overflow-hidden"
      :class="
        disableBorders && isMobile
          ? 'border-black-950 mobile-top-fade-overlay'
          : enableBorderFlare
            ? 'border-black-800 border-flare-top rounded-[20px] border-1'
            : 'border-black-800 rounded-[20px] border-1'
      "
    >
      <div
        class="absolute top-0 left-0 m-[1px] h-full w-full"
        :class="
          isMobile
            ? 'from-black-800/30 to-black-800 bg-gradient-to-b'
            : 'bg-black-950'
        "
      ></div>
      <div
        class="radial-gradient-bg absolute top-0 left-0 z-0 h-full w-full opacity-40"
      ></div>

      <div
        v-if="enableDots"
        class="dotted-background absolute z-10 rounded-xl"
      ></div>
      <div class="relative z-20">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.card-container {
  position: relative;
}

.card-container canvas {
  width: 100% !important;
  height: auto !important;
  padding: 0;
  margin: 0;
}

.dotted-background {
  background: none !important;
}

.dotted-background::before {
  content: '';
  position: absolute;
  inset: -5px;
  /* shorthand for top/left/right/bottom */
  /* 1️⃣  Dot pattern  */
  background: radial-gradient(
    circle at top center,
    rgb(140 140 140) 1px,
    /* dot radius ↓ to 1 px  */ transparent 1px
  );
  background-size: 14px 14px;
  /* grid spacing ↑ to 16 px */

  /* 2️⃣  Mask for faster fade-out  */
  mask-image: radial-gradient(
    circle at top center,
    rgba(255 255 255 / 0.9) 100%,
    /* fully visible at centre */ rgba(255 255 255 / 0.6) 10030%,
    /* fade starts sooner  */ rgba(255 255 255 / 0.2) 100%,
    /* steeper drop-off    */ rgba(255 255 255 / 0) 100%
  );
  /* invisible after 50% */
  -webkit-mask-image: radial-gradient(
    circle at top center,
    rgba(255 255 255 / 0.9) 100%,
    rgba(255 255 255 / 0.6) 100%,
    rgba(255 255 255 / 0.2) 100%,
    rgba(255 255 255 / 0) 100%
  );
}

.border-flare-top {
  border-top: 1px solid transparent;
  /* Apply gradient to top border */
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-radius: 20px;
  /* Rounded corners */
  border-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 3%,
      rgba(47, 47, 47, 0) 3%,
      rgb(130, 130, 130) 45%,
      rgb(140, 140, 140) 50%,
      rgb(130, 130, 130) 55%,
      rgba(47, 47, 47, 0) 97%,
      rgba(255, 255, 255, 0) 97%
    )
    1;
  border-image-slice: 1 0 0 0;
  /* Apply the gradient only to the top border */
}

.border-flare-top::after {
  content: '';
  position: absolute;
  top: -10px;
  transform: translate(-50%);
  /* aligns with top edge */
  left: 50%;
  width: 80%;
  height: 100px;
  /* glow thickness */
  pointer-events: none;
  z-index: 1;

  background: radial-gradient(
    ellipse at top center,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.2) 10%,
    rgba(255, 255, 255, 0.1) 40%,
    rgba(255, 255, 255, 0) 100%
  );

  filter: blur(8px);
  opacity: 0.4;
}
</style>
