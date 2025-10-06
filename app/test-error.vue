<template>
    <NuxtLayout name="404">
        <div>
            <div class="text-4xl">You've Arrived Here on Error, boss</div>
            <UButton variant="solid" color="orange" class="text-white" @click="goBack">Go back</UButton>
        </div>
    </NuxtLayout>
</template>

<script script setup>
const { router } = useRouter()
const goBack = () => {
    router.push('/')
}
</script>

<style scoped>
.button {
    padding: 4px 6px;
    margin: 10px 0px;
    background: black;
    color: white;
}
</style>