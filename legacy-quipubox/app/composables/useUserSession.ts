import type { Session } from '@supabase/supabase-js'

export const useUserSession = () => {
    const session = ref<Session | null>(null)
    const user = computed(() => session.value?.user ?? null)
    const isLoading = ref(true)

    const fetchSession = async () => {
        // Solo en cliente
        if (process.server) {
            isLoading.value = false
            return
        }

        const { $supabase } = useNuxtApp()
        if (!$supabase) {
            console.error('Supabase no disponible')
            isLoading.value = false
            return
        }

        try {
            const { data: { session: currentSession } } = await $supabase.auth.getSession()
            session.value = currentSession
        } catch (error) {
            console.error('Error obteniendo sesión', error)
            session.value = null
        } finally {
            isLoading.value = false
        }
    }

    const signOut = async () => {
        if (process.server) return
        const { $supabase } = useNuxtApp()
        if (!$supabase) return
        await $supabase.auth.signOut()
        session.value = null
        await navigateTo('/login')
    }

    // Escuchar cambios en la sesión (opcional)
    const initAuthListener = () => {
        if (process.server) return
        const { $supabase } = useNuxtApp()
        if (!$supabase) return
        return $supabase.auth.onAuthStateChange((_event, newSession) => {
            session.value = newSession
        }).data.subscription
    }

    return {
        session,
        user,
        isLoading,
        fetchSession,
        signOut,
        initAuthListener,
    }
}