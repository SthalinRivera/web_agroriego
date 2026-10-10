import type { AuthProfile } from '~/types/auth'

export const useAuth = () => {
  const { $supabase } = useNuxtApp()
  const config = useRuntimeConfig()
  const token = useState<string | null>('auth-token', () => null)
  const user = useState<AuthProfile | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => false)
  const errorMessage = useState('auth-error', () => '')
  const configured = computed(() => Boolean($supabase))

  const fetchUser = async () => {
    if (!$supabase) throw new Error('Falta configurar Supabase en el archivo .env de la web.')
    const { data, error } = await $supabase.auth.getSession()
    if (error || !data.session) {
      token.value = null
      user.value = null
      throw new Error('Tu sesión ha vencido. Inicia sesión nuevamente.')
    }
    token.value = data.session.access_token
    try {
      user.value = await $fetch<AuthProfile>(`${config.public.apiBase.replace(/\/$/, '')}/auth/profile`, {
        headers: { Authorization: `Bearer ${token.value}` }, timeout: 15000, retry: 0
      })
      errorMessage.value = ''
      return user.value
    } catch (cause) {
      user.value = null
      const status = (cause as { statusCode?: number }).statusCode
      if (status === 401 || status === 403) {
        await $supabase.auth.signOut({ scope: 'local' })
        token.value = null
        throw new Error('Tu cuenta no tiene acceso activo a Agroriego. Contacta al administrador.')
      }
      throw new Error('No se pudo conectar con la API de Agroriego. Inténtalo nuevamente.')
    }
  }

  const loginWithPassword = async (email: string, password: string) => {
    loading.value = true
    errorMessage.value = ''
    try {
      if (!$supabase) throw new Error('Falta configurar Supabase en el archivo .env de la web.')
      const { error } = await $supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw new Error('No se pudo iniciar sesión. Revisa tu correo y contraseña.')
      await fetchUser()
      await navigateTo('/dashboard')
    } catch (cause) {
      errorMessage.value = cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.'
    } finally {
      loading.value = false
    }
  }

  const loginWithGoogle = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
      if (!$supabase) throw new Error('Falta configurar Supabase en el archivo .env de la web.')
      const { error } = await $supabase.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) throw new Error('No se pudo conectar con Google. Inténtalo nuevamente.')
    } catch (cause) {
      errorMessage.value = cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.'
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      const result = await $supabase?.auth.signOut({ scope: 'local' })
      if (result?.error) throw result.error
      token.value = null
      user.value = null
      errorMessage.value = ''
      await navigateTo('/login')
    } catch {
      errorMessage.value = 'No se pudo cerrar la sesión. Inténtalo nuevamente.'
    } finally {
      loading.value = false
    }
  }
  return { token, user, loading, errorMessage, configured, fetchUser, loginWithPassword, loginWithGoogle, logout }
}
