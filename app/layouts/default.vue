<template>
  <UApp :toaster="{ position: 'top-center' }">
    <div>
      <AppLayouts>
        <AppPopupsChoosePortfolios />

        <slot />
      </AppLayouts>
    </div>
  </UApp>
</template>
