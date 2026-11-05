<script setup lang="ts">
const { loginWithGoogle, loading, errorMessage, configured } = useAuth()
useSeoMeta({ title: 'Iniciar sesión | Agroriego' })
</script>

<template>
  <main class="login-shell">
    <section class="field-panel" aria-label="Agroriego, riego inteligente">
      <a href="/login" class="brand"><span class="brand-mark"><UIcon name="i-lucide-sprout" /></span>Agroriego<span class="brand-dot">®</span></a>
      <div class="field-copy">
        <span class="eyebrow"><span /> TECNOLOGÍA QUE CULTIVA</span>
        <h1>Cada gota cuenta.<br><em>Cada cultivo importa.</em></h1>
        <p>Conecta con tu campo y toma mejores decisiones de riego, desde un solo lugar.</p>
        <div class="field-tags">
          <span><UIcon name="i-lucide-droplets" /> Riego inteligente</span><span><UIcon name="i-lucide-radio" /> Monitoreo del campo</span>
        </div>
      </div>
      <div class="landscape" aria-hidden="true">
        <div class="sun" /><div class="hill hill-back" /><div class="hill hill-front" /><div class="furrows" />
      </div>
      <div class="field-footer">
        <span>Cultiva con información. Riega con precisión.</span><UIcon name="i-lucide-arrow-up-right" />
      </div>
    </section>
    <section class="form-panel">
      <div class="form-top">
        <UIcon name="i-lucide-leaf" /> PLATAFORMA DE GESTIÓN AGRÍCOLA
      </div>
      <div class="login-form">
        <div class="welcome-icon">
          <UIcon name="i-lucide-log-in" />
        </div>
        <p class="form-kicker">
          BIENVENIDO A TU CAMPO DIGITAL
        </p>
        <h2>Inicia sesión</h2>
        <p class="form-description">
          Continúa con tu cuenta de Google para acceder a Agroriego.
        </p>
        <div v-if="!configured" class="login-error" role="alert">
          Falta configurar la conexión con Supabase. Revisa el archivo .env de la web.
        </div>
        <div v-if="errorMessage" class="login-error" role="alert">
          {{ errorMessage }}
        </div>
        <button
          type="button"
          class="google-button"
          :disabled="loading || !configured"
          @click="loginWithGoogle"
        >
          <UIcon :name="loading ? 'i-lucide-loader-circle' : 'i-simple-icons-google'" :class="{ 'animate-spin': loading }" />{{ loading ? 'Conectando…' : 'Continuar con Google' }}
        </button>
        <p class="access-note">
          ¿Aún no tienes acceso?<br><strong>Contacta al administrador de tu organización.</strong>
        </p>
      </div>
      <footer class="form-footer">
        <span>© {{ new Date().getFullYear() }} Agroriego</span><span><UIcon name="i-lucide-shield-check" /> Acceso seguro</span>
      </footer>
    </section>
  </main>
</template>
