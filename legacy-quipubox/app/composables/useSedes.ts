// composables/useSedes.ts
import type { Sede } from '~/types/cliente'

export const useSedes = () => {
    const sedes = ref<Sede[]>([])
    const loading = ref(false)
    const { fetchWithAuth } = useApi()

    const fetchSedes = async () => {
        loading.value = true
        try {
            const data = await fetchWithAuth<Sede[]>('sedes') // asumiendo endpoint GET /sedes
            sedes.value = data
        } catch (error) {
            console.error('Error fetching sedes:', error)
        } finally {
            loading.value = false
        }
    }

    return { sedes, loading, fetchSedes }
}