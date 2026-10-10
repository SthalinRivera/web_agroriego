export default defineNuxtRouteMiddleware(async (to) => {
  const { token, fetchUser, errorMessage } = useAuth()
  const protectedRoute = to.path.startsWith('/dashboard')
  if (!protectedRoute && to.path !== '/login' && to.path !== '/') return
  if (!token.value) {
    if (protectedRoute || to.path === '/') return navigateTo('/login')
    return
  }
  try {
    await fetchUser()
    if (!protectedRoute) return navigateTo('/dashboard')
  } catch (cause) {
    errorMessage.value = cause instanceof Error ? cause.message : 'No se pudo validar tu acceso.'
    if (protectedRoute || to.path === '/') return navigateTo('/login')
  }
})
