// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt'
  ], ssr: false,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'], colorMode: { preference: 'light' },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',

      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,

      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY
    }
  }, ignore: ['legacy-quipubox/**'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },
  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
