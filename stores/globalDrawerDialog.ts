import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'
import type { Component } from 'vue'

type ActionType = 'primary' | 'secondary' | 'danger' | 'ghost'
type ModalMode = 'drawer' | 'dialog'

export interface DrawerDialogAction {
  key?: string
  type?: ActionType
  label?: string
  icon?: Component | null
  loading?: boolean
  disabled?: boolean
  closeOnClick?: boolean // default true
  run?: (ctx: { close: () => void }) => Promise<void> | void
}

export interface DrawerDialogConfig {
  mode?: ModalMode
  title?: string | null
  description?: string | null
  component?: Component | null
  componentName?: string | null
  componentProps?: Record<string, any>
  footerText?: string | null
  actions?: DrawerDialogAction[]
  backdropClose?: boolean
  escClose?: boolean
  widthClass?: string
}

const defaults: Required<
  Omit<
    DrawerDialogConfig,
    | 'title'
    | 'description'
    | 'component'
    | 'componentName'
    | 'componentProps'
    | 'footerText'
    | 'actions'
  >
> = {
  mode: 'drawer',
  backdropClose: true,
  escClose: true,
  widthClass: '',
}

const componentRegistry: Record<string, Component> = {}

export function registerDrawerDialogComponent(name: string, comp: Component) {
  componentRegistry[name] = comp
}

export const useGlobalDrawerDialogStore = defineStore(
  'globalDrawerDialogStore',
  () => {
    const isMobile = useIsMobile()

    console.log(
      'isMobile in globalDrawerDialogStore:',
      isMobile.value,
      isMobile.value ? 'drawer' : 'dialog',
    )

    const open = ref(false)
    const config = reactive<DrawerDialogConfig>({
      mode: isMobile.value ? 'drawer' : 'dialog',
      title: null,
      description: null,
      component: null,
      componentName: null,
      componentProps: {},
      footerText: null,
      actions: [],
      backdropClose: true,
      escClose: true,
      widthClass: '',
    })

    function resolveComponent(): Component | null {
      if (config.component) return config.component
      if (config.componentName && componentRegistry[config.componentName]) {
        return componentRegistry[config.componentName]
      }
      return null
    }

    function openModal(partial: DrawerDialogConfig = {}) {
      Object.assign(
        config,
        {
          mode: partial.mode ?? (isMobile.value ? 'drawer' : 'dialog'),
          title: null,
          description: null,
          component: null,
          componentName: null,
          componentProps: {},
          footerText: null,
          actions: [],
          backdropClose: true,
          escClose: true,
          widthClass: '',
        },
        partial,
        {
          componentProps: partial.componentProps ?? {},
          actions: partial.actions ?? [],
        },
      )
      open.value = true
    }

    function closeModal() {
      open.value = false
    }

    async function runAction(action: DrawerDialogAction) {
      const shouldClose = action.closeOnClick ?? true
      try {
        if (action.run) {
          await action.run({ close: closeModal })
        }
      } finally {
        if (shouldClose) closeModal()
      }
    }

    watch(
      isMobile,
      (mobile) => {
        if (!open.value) {
          config.mode = mobile ? 'drawer' : 'dialog'
        }
      },
      { immediate: true },
    )
    return {
      // state
      open,
      config,
      // getters/util
      resolveComponent,
      // actions
      openModal,
      closeModal,
      runAction,
      registerDrawerDialogComponent,
    }
  },
)
