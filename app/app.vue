<script setup lang="ts">
useHead({ htmlAttrs: { lang: 'es' }, meta: [{ name: 'theme-color', content: '#173e2e' }] })
useSeoMeta({ title: 'Agroriego | Riego inteligente', description: 'Plataforma de gestión y monitoreo de riego.' })
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="#39875a" />
    <NuxtLayout><NuxtPage /></NuxtLayout>
  </UApp>
</template>
