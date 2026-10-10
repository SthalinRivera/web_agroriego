// composables/useUsuarios.ts
import type { Usuario } from '~/types/usuario'

export const useUsuarios = () => {
  const usuarios = ref<Usuario[]>([])
  const loading = ref(false)
  const { fetchWithAuth } = useApi()

  const fetchAll = async () => {
    loading.value = true
    try {
      const data = await fetchWithAuth<Usuario[]>('usuarios')
      usuarios.value = data
    } catch (error) {
      console.error('Error fetching usuarios:', error)
    } finally {
      loading.value = false
    }
  }

  const create = async (usuario: Partial<Usuario>) => {
    const newUser = await fetchWithAuth<Usuario>('usuarios', {
      method: 'POST',
      body: usuario
    })
    await fetchAll()
    return newUser
  }

  const update = async (id: number, usuario: Partial<Usuario>) => {
    const updated = await fetchWithAuth<Usuario>(`usuarios/${id}`, {
      method: 'PUT',
      body: usuario
    })
    await fetchAll()
    return updated
  }

  const remove = async (id: number) => {
    await fetchWithAuth(`usuarios/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  const bloquear = async (id: number) => {
    await fetchWithAuth(`usuarios/${id}/bloquear`, { method: 'PATCH' })
    await fetchAll()
  }

  const activar = async (id: number) => {
    await fetchWithAuth(`usuarios/${id}/activar`, { method: 'PATCH' })
    await fetchAll()
  }

  return {
    usuarios,
    loading,
    fetchAll,
    create,
    update,
    remove,
    bloquear,
    activar
  }
}