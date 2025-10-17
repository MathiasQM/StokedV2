<template>
  <!-- <template v-if="isMobile">
    <Drawer>
      <DrawerTrigger>{{ user?.currency || 'Select currency' }}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose>
            <Button variant="outline"> Cancel </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </template> -->

  <!-- <template v-else> -->
  <Select @update:model-value="(val) => emit('update:selected', val)">
    <SelectTrigger class="w-[180px]">
      <SelectValue :placeholder="selected || 'Select currency'" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Currencies</SelectLabel>
        <SelectItem
          v-for="(currency, code) in options"
          :key="code"
          :value="currency"
        >
          {{ currency }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
  <!-- </template> -->
</template>

<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const { options, selected } = defineProps<{
  options: string[]
  selected: string | null | undefined
}>()

const emit = defineEmits<{
  (e: 'update:selected', value: string): void
}>()
</script>
