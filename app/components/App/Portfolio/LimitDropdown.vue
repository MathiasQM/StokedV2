<template>
  <Drawer v-model:open="model">
    <DrawerContent>
      <div class="mx-auto w-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle class="text-center">{{
            computedText.title
          }}</DrawerTitle>
          <DrawerDescription class="text-center">{{
            computedText.description
          }}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter class="mb-10">
          <DrawerClose v-if="currentPlan.name !== 'Unlimited'" as-child>
            <NuxtLink class="w-full" to="/account?tab=billing">
              <Button class="w-full">
                Upgrade to
                {{ currentPlan.name === 'Pro' ? 'Unlimited' : 'Pro' }}
              </Button>
            </NuxtLink>
          </DrawerClose>
          <DrawerClose as-child>
            <Button variant="outline"> Close </Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const props = defineProps<{
  upradeModal: boolean
  activeSubscription: any
  currentPlan: any
}>()

const emit = defineEmits<{
  (e: 'update:upradeModal', value: boolean): void
}>()

const model = computed({
  get: () => props.upradeModal,
  set: (value) => emit('update:upradeModal', value),
})

const computedText = computed(() => {
  if (!props.activeSubscription) {
    return {
      title: `Upgrade to to add more portfolios`,
      description: `The free plan allows only 1 portfolio. Upgrade to Pro or Unlimited to add more portfolios`,
    }
  } else if (
    props.activeSubscription.status === 'active' &&
    props.currentPlan.name === 'Pro'
  ) {
    return {
      title: `Upgrade to to Unlimited to add more portfolios`,
      description: `The Pro plan allows only 2 portfolios. Upgrade to Unlimited to add more portfolios`,
    }
  } else
    return {
      title: `We offer a maximum of 4 portfolios at the moment`,
      description: `Feel free to reach out if, you'd like a higher limit`,
    }
})
</script>
