<script setup lang="ts">
const router = useRouter();
const { $supabase } = useNuxtApp();
const { fetchUser } = useAuth();

onMounted(async () => {
  // Pequeño retraso para dar tiempo a que Supabase procese el hash
  await new Promise(resolve => setTimeout(resolve, 300));

  let resolved = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let unsubscribe: () => void = () => {};

  const handleSuccess = async () => {
    if (resolved) return;
    resolved = true;
    clearTimeout(timeoutId);
    unsubscribe();
    await fetchUser();
    router.push('/dashboard/perfil');
  };

  try {
    // Escuchar eventos de autenticación (SIGNED_IN para nuevos, INITIAL_SESSION para existentes)
    const { data: { subscription } } = $supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        await handleSuccess();
      }
    });
    unsubscribe = () => subscription.unsubscribe();

    // También intentar obtener la sesión directamente (por si el evento ya ocurrió antes)
    const { data: { session } } = await $supabase.auth.getSession();
    if (session) {
      await handleSuccess();
      return;
    }

    // Timeout de 10 segundos
    timeoutId = setTimeout(() => {
      if (!resolved) {
        unsubscribe();
        console.error('Timeout esperando autenticación de Supabase');
        router.push('/login');
      }
    }, 10000);
  } catch (error) {
    console.error('Callback error:', error);
    router.push('/login');
  }
});
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <p>Completando autenticación...</p>
  </div>
</template>