<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const label = computed(() => isDark.value ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro')
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <UButton
      :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
      :aria-label="label"
      :title="label"
      color="neutral"
      variant="ghost"
      @click="toggleTheme"
    />
    <template #fallback>
      <span class="size-8" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
