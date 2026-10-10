export default defineNuxtRouteMiddleware((to) => {
    const { token } = useAuth()

    // Proteger rutas del dashboard
    if (to.path.startsWith('/dashboard') && !token.value) {
        return navigateTo('/login')
    }

    // Evitar que usuarios autenticados ingresen al login
    if ((to.path === '/login' || to.path === '/') && token.value) {
        return navigateTo('/dashboard')
    }
})
