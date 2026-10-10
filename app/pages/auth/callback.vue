<script setup lang="ts">
const { fetchUser, errorMessage } = useAuth()
onMounted(async () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (params.has('error') || hash.has('error')) throw new Error('El acceso con Google fue cancelado o rechazado.')
    await fetchUser()
    await navigateTo('/dashboard', { replace: true })
  } catch (cause) {
    errorMessage.value = cause instanceof Error ? cause.message : 'No se pudo completar el acceso.'
    await navigateTo('/login', { replace: true })
  }
})
</script>

<template>
  <main class="min-h-screen grid place-items-center bg-stone-50 text-emerald-950" aria-live="polite">
    <div class="text-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin mb-4" />
      <p>Validando tu acceso a Agroriego…</p>
    </div>
  </main>
</template>
