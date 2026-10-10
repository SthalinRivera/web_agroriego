// composables/useRoles.ts
import type { Rol } from '~/types/usuario'

export const useRoles = () => {
    const roles = ref<Rol[]>([])
    const loading = ref(false)
    const { fetchWithAuth } = useApi()

    const fetchRoles = async () => {
        loading.value = true
        try {
            const data = await fetchWithAuth<Rol[]>('roles-usuarios')
            roles.value = data.filter(r => r.estado !== false)
        } catch (error) {
            console.error('Error fetching roles:', error)
        } finally {
            loading.value = false
        }
    }

    return { roles, loading, fetchRoles }
}