<!-- components/LogoIcon.vue -->
<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="flex items-center justify-center gap-2">
    <!-- Aquí va tu ícono (puede ser un SVG o algo similar) -->
    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold">
      L
    </div>
    
    <!-- Solo se muestra si NO está colapsado -->
    <span v-if="!collapsed" class="text-lg font-semibold tracking-tight">
      QuipuBox
    </span>
  </div>
</template>