<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { computed, useSlots, type PropType, Comment, Text } from 'vue'

const props = defineProps({
  variant: {
    type: String as PropType<'pill' | 'circle' | 'square'>, // 'glow' removed
    required: false,
    default: 'pill',
  },
  disableGradient: {
    type: Boolean,
    required: false,
    default: false,
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  width: {
    type: String,
    required: false,
    default: undefined,
  },
  height: {
    type: String,
    required: false,
    default: undefined,
  },
  buttonText: {
    type: String,
    required: false,
    default: undefined,
  },
})

const slots = useSlots()

/**
 * Checks if the default slot has any "real" content (not just comments or whitespace).
 */
const hasDefaultSlot = computed(() => {
  if (!slots.default) return false
  return slots.default().some((vnode) => {
    if (vnode.type === Comment) return false // Ignore comments
    if (vnode.type === Text && !vnode.children?.trim()) return false // Ignore whitespace
    return true // Found a valid element or text
  })
})

/**
 * Checks if the icon slot has content.
 */
const hasIconSlot = computed(() => !!slots.icon)

/**
 * Computes the dynamic classes for the outer wrapper div.
 * This handles the gradient, glow, and shaping.
 */
const wrapperClasses = computed(() => {
  return [
    'flex items-center justify-center transition-all',
    // Apply gradient border ONLY if gradient is enabled
    !props.disableGradient ? 'py-[1px] px-[1px] gradient' : '',
    // Apply shape
    props.variant === 'square' ? 'rounded-md' : 'rounded-full', // pill & circle are -full
  ]
})

/**
 * Computes the dynamic classes for the inner <Button> component.
 * This handles padding and layout.
 */
const buttonClasses = computed(() => {
  const classes = [
    // Base style
    'bg-neutral-800 text-white line text-[10px] font-thin',
    'whitespace-nowrap leading-none',
    'flex items-center justify-center',

    // Interaction & Disabled State
    'cursor-pointer',
    'disabled:bg-neutral-900 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-100', // Override shadcn disabled state

    // Prop-based styles
    props.width ? props.width : '',
    props.height ? props.height : 'h-auto',
  ]

  // === 1. Shape ===
  if (props.variant === 'square') {
    classes.push('rounded-md')
  } else {
    // 'pill' or 'circle'
    classes.push('rounded-full')
  }

  // === 2. Sizing (Aspect) ===
  if (
    !props.width &&
    !props.height &&
    (props.variant === 'circle' || props.variant === 'square')
  ) {
    classes.push('aspect-square')
  }

  // === 3. Padding ===
  if (props.variant === 'circle' || props.variant === 'square') {
    classes.push('p-[6px]')
  } else {
    // 'pill'
    classes.push('px-3 py-[6px]')
  }

  return classes
})

/**
 * Computes classes for the icon's <span> wrapper.
 * Adds a margin only if there is text next to it.
 */
const iconClasses = computed(() => {
  return hasDefaultSlot.value ? 'mr-1.5' : ''
})
</script>

<template>
  <div :class="wrapperClasses">
    <Button v-bind="$attrs" :class="buttonClasses" :disabled="disabled">
      <span v-if="hasIconSlot" :class="iconClasses">
        <slot name="icon" />
      </span>

      <span v-if="hasDefaultSlot">
        <slot />
      </span>
      <span v-else-if="buttonText">
        {{ buttonText }}
      </span>
    </Button>
  </div>
</template>

<style scoped>
/* Your original gradient */
.gradient {
  background: linear-gradient(
    130deg,
    rgba(150, 150, 150, 0.3) 20%,
    rgba(150, 150, 150, 0.7) 40%,
    rgba(150, 150, 150, 0.8) 50%,
    rgba(150, 150, 150, 0.8) 60%,
    rgba(150, 150, 150, 0.7) 70%,
    rgba(150, 150, 150, 0.3) 90%
  );
}

/* .glow-wrapper style removed */
</style>
