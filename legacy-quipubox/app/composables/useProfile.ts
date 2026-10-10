// composables/useProfile.ts
import type { Ref } from 'vue'

export interface Profile {
    // ... tus tipos
}

export const useProfile = () => {
    const profile = useState<Profile | null>('profile', () => null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const { fetchWithAuth } = useApi()   // ← importar useApi

    const fetchProfile = async () => {
        loading.value = true
        error.value = null
        try {
            const data = await fetchWithAuth<Profile>('auth/profile') // ← sin barra inicial
            profile.value = data
        } catch (err: any) {
            error.value = err.message || 'Error al cargar el perfil'
            console.error('Fetch profile error:', err)
        } finally {
            loading.value = false
        }
    }

    return {
        profile: readonly(profile) as Ref<Profile | null>,
        loading: readonly(loading),
        error: readonly(error),
        fetchProfile
    }
}