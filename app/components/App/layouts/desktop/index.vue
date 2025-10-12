<template>
  <template v-if="!smallerThanLg">
    <div class="h-[100dvh] flex-col">
      <div class="flex h-full">
        <div
          class="border-neutral-800 w-64 shrink-0 border-r bg-white p-2 dark:bg-neutral-900"
        >
          <AppSidebar />
        </div>
        <AppLayoutsDesktopHeader>
          <slot />
        </AppLayoutsDesktopHeader>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="flex h-[100dvh]">
      <USlideover
        side="left"
        class="h-full"
        v-model:open="openSidebar"
        :ui="{ content: 'max-w-[50%] sm:max-w-[30%]' }"
      >
        <template #content>
          <div class="flex h-full flex-col p-2">
            <AppSidebar />
          </div>
        </template>
      </USlideover>
      <AppLayoutsDesktopHeader @open-sidebar="openSidebar = !openSidebar">
        <slot />
      </AppLayoutsDesktopHeader>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
const breakpoints = useBreakpoints(breakpointsTailwind)
const openSidebar = ref(false)
const smallerThanLg = breakpoints.smaller('lg')
</script>
