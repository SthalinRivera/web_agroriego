export default defineNuxtPlugin({
  name: 'auth',
  dependsOn: ['supabase'],
  async setup() {
    const { token, user, errorMessage } = useAuth()
    const client = useNuxtApp().$supabase
    if (!client) return
    // Do not await Supabase calls inside this listener: it can deadlock.
    client.auth.onAuthStateChange((_event, session) => {
      token.value = session?.access_token ?? null
      if (!session) {
        user.value = null
        if (window.location.pathname.startsWith('/dashboard')) void navigateTo('/login')
      }
    })
    const { data, error } = await client.auth.getSession()
    token.value = data.session?.access_token ?? null
    if (error) errorMessage.value = 'No se pudo recuperar tu sesión. Vuelve a iniciar sesión.'
  }
})
