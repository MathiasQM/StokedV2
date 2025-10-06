<template>
  <div clas="">
    <div @click="closeMenu" class="relative z-20 w-8">
      <button
        @click="toggleMenu"
        class="transition-all hover:bg-black-800 h-8 w-8 flex justify-center items-center rounded-full"
      >
        <Icon name="ph:dots-three-vertical-bold" class="text-[white] text-xl" />
      </button>
      <Transition name="fade" mode="out-in">
        <div
          v-if="showMenu"
          class="transition-all absolute right-0 bg-black-900 border border-black-500 rounded-2xl w-36 h-10 mt-2"
          @click="closeMenu"
        >
          <slot />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const showMenu = ref(false);

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const closeMenu = () => {
  if (!showMenu.value) showMenu.value = false;
};
</script>
