<script setup lang="ts">
const { loginWithPassword, loginWithGoogle, loading, errorMessage, configured } = useAuth()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
          Ingresa a tu cuenta para continuar.
        </p>
        <div v-if="!configured" class="login-error" role="alert">
          Falta configurar la conexión con Supabase. Revisa el archivo .env de la web.
        </div>
        <div v-if="errorMessage" class="login-error" role="alert">
          {{ errorMessage }}
        </div>
        <form @submit.prevent="loginWithPassword(email, password)">
          <label for="email">Correo electrónico</label>
          <div class="input-wrap">
            <UIcon name="i-lucide-mail" /><input
              id="email"
              v-model="email"
              name="email"
              type="email"
              autocomplete="username"
              placeholder="nombre@empresa.com"
              required
              :disabled="loading"
            >
          </div>
          <label for="password">Contraseña</label>
          <div class="input-wrap">
            <UIcon name="i-lucide-lock-keyhole" /><input
              id="password"
              v-model="password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Ingresa tu contraseña"
              required
              :disabled="loading"
            ><button
              type="button"
              class="show-password"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
            </button>
          </div>
          <button type="submit" class="submit-button" :disabled="loading || !configured">
            <UIcon v-if="loading" name="i-lucide-loader-circle" class="animate-spin" />{{ loading ? 'Conectando…' : 'Ingresar a Agroriego' }}<UIcon v-if="!loading" name="i-lucide-arrow-right" />
          </button>
        </form>
        <div class="divider">
          <span />o continúa con<span />
        </div>
        <button class="google-button" :disabled="loading || !configured" @click="loginWithGoogle">
          <UIcon name="i-simple-icons-google" />Continuar con Google
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
