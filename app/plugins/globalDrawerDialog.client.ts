import CustomButtonsShiny from '@/components/Custom/Buttons/Shiny.vue'
import article from '~/components/App/Global/DrawerDialog/components/article.vue'
import MediaController from '~/components/App/Brief/MediaController.vue'
import { useGlobalDrawerDialogStore } from '@@/stores/globalDrawerDialog'

export default defineNuxtPlugin(() => {
  const store = useGlobalDrawerDialogStore()
  store.registerDrawerDialogComponent('CustomButtonsShiny', CustomButtonsShiny)
  store.registerDrawerDialogComponent('article', article)
  store.registerDrawerDialogComponent('MediaController', MediaController)
})
