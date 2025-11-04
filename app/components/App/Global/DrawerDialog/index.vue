<script setup lang="ts">
import { computed } from 'vue'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { useGlobalDrawerDialogStore } from '~~/stores/globalDrawerDialog'

const store = useGlobalDrawerDialogStore()

const isDrawer = computed(() => (store.config.mode ?? 'drawer') === 'drawer')
const DynComp = computed(() => store.resolveComponent())

function onBackdropClose() {
  if (store.config.backdropClose ?? true) store.closeModal()
}
function onEscClose() {
  if (store.config.escClose ?? true) store.closeModal()
}

function btnVariant(type?: 'primary' | 'secondary' | 'danger' | 'ghost') {
  switch (type) {
    case 'secondary':
      return 'secondary'
    case 'danger':
      return 'destructive'
    case 'ghost':
      return 'ghost'
    case 'primary':
    default:
      return 'default'
  }
}
</script>

<template>
  <Drawer
    v-if="isDrawer"
    :open="store.open"
    @update:open="(val) => !val && store.closeModal()"
  >
    <DrawerContent
      :class="[
        store.config.widthClass,
        'h-[85vh] max-h-[85vh] overflow-hidden flex flex-col',
      ]"
      @interact-outside="onBackdropClose"
      @escape-key-down="onEscClose"
    >
      <DrawerHeader v-if="store.config.title || store.config.description">
        <DrawerTitle v-if="store.config.title" class="text-center text-xl">
          {{ store.config.title }}
        </DrawerTitle>
        <DrawerDescription
          v-if="store.config.description"
          class="text-center text-sm opacity-80"
        >
          {{ store.config.description }}
        </DrawerDescription>
      </DrawerHeader>

      <div class="flex-1 min-h-0">
        <component
          v-if="DynComp"
          :is="DynComp"
          v-bind="store.config.componentProps"
        />
        <slot v-else />
      </div>

      <DrawerFooter
        v-if="
          store.config.footerText ||
          (store.config.actions && store.config.actions.length)
        "
      >
        <p
          v-if="store.config.footerText"
          class="text-sm opacity-80 text-center"
        >
          {{ store.config.footerText }}
        </p>
        <div class="flex gap-2 justify-end">
          <Button
            v-for="(a, idx) in store.config.actions"
            :key="a.key || idx"
            :variant="btnVariant(a.type)"
            :disabled="a.disabled"
            :data-loading="a.loading ? '' : null"
            @click="store.runAction(a)"
          >
            <component v-if="a.icon" :is="a.icon" class="mr-2 h-4 w-4" />
            <span v-if="a.label">{{ a.label }}</span>
          </Button>
          <DrawerClose
            as-child
            v-if="!store.config.actions || store.config.actions.length === 0"
          >
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog
    v-else
    :open="store.open"
    @update:open="(val) => !val && store.closeModal()"
  >
    <DialogContent
      :class="store.config.widthClass || 'sm:max-w-md'"
      @interact-outside="onBackdropClose"
      @escape-key-down="onEscClose"
    >
      <DialogHeader v-if="store.config.title || store.config.description">
        <DialogTitle v-if="store.config.title" class="text-center text-xl">
          {{ store.config.title }}
        </DialogTitle>
        <DialogDescription
          v-if="store.config.description"
          class="text-center text-sm opacity-80"
        >
          {{ store.config.description }}
        </DialogDescription>
      </DialogHeader>

      <div>
        <component
          v-if="DynComp"
          :is="DynComp"
          v-bind="store.config.componentProps"
        />
        <slot v-else />
      </div>

      <DialogFooter
        v-if="
          store.config.footerText ||
          (store.config.actions && store.config.actions.length)
        "
      >
        <p
          v-if="store.config.footerText"
          class="text-sm opacity-80 text-center w-full"
        >
          {{ store.config.footerText }}
        </p>
        <div class="flex gap-2 justify-end w-full">
          <Button
            v-for="(a, idx) in store.config.actions"
            :key="a.key || idx"
            :variant="btnVariant(a.type)"
            :disabled="a.disabled"
            :data-loading="a.loading ? '' : null"
            @click="store.runAction(a)"
          >
            <component v-if="a.icon" :is="a.icon" class="mr-2 h-4 w-4" />
            <span v-if="a.label">{{ a.label }}</span>
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
