// composables/useClientes.ts
import type { Cliente, ClienteSede, Puesto } from '~/types/cliente'

export const useClientes = () => {
    const clientes = ref<Cliente[]>([])
    const loading = ref(false)
    const { fetchWithAuth } = useApi()

    const fetchAll = async (buscar?: string) => {
        loading.value = true
        try {
            const url = buscar ? `clientes?buscar=${encodeURIComponent(buscar)}` : 'clientes'
            const data = await fetchWithAuth<Cliente[]>(url)
            clientes.value = data
        } catch (error) {
            console.error('Error fetching clientes:', error)
        } finally {
            loading.value = false
        }
    }

    const create = async (cliente: Partial<Cliente>) => {
        const newCliente = await fetchWithAuth<Cliente>('clientes', {
            method: 'POST',
            body: cliente
        })
        await fetchAll()
        return newCliente
    }

    const update = async (id: number, cliente: Partial<Cliente>) => {
        const updated = await fetchWithAuth<Cliente>(`clientes/${id}`, {
            method: 'PUT',
            body: cliente
        })
        await fetchAll()
        return updated
    }

    const remove = async (id: number) => {
        await fetchWithAuth(`clientes/${id}`, { method: 'DELETE' })
        await fetchAll()
    }

    // Obtener sedes de un cliente
    const getSedes = async (clienteId: number) => {
        return await fetchWithAuth<ClienteSede[]>(`clientes/${clienteId}/sedes`)
    }

    // Asociar cliente con sede
    const associateSede = async (clienteId: number, sedeId: number, tipoRelacion: string) => {
        return await fetchWithAuth<ClienteSede>('clientes/sedes', {
            method: 'POST',
            body: { id_cliente: clienteId, id_sede: sedeId, tipo_relacion: tipoRelacion }
        })
    }

    // Obtener puestos (roles) de un cliente
    const getPuestos = async (clienteId: number) => {
        return await fetchWithAuth<Puesto[]>(`clientes/${clienteId}/puestos`)
    }

    // Asignar puesto a cliente
    const assignPuesto = async (clienteId: number, puestoId: number) => {
        return await fetchWithAuth(`clientes/${clienteId}/puestos`, {
            method: 'POST',
            body: { id_puesto: puestoId }
        })
    }

    // Remover puesto de cliente
    const removePuesto = async (clienteId: number, puestoId: number) => {
        return await fetchWithAuth(`clientes/${clienteId}/puestos/${puestoId}`, {
            method: 'DELETE'
        })
    }

    return {
        clientes,
        loading,
        fetchAll,
        create,
        update,
        remove,
        getSedes,
        associateSede,
        getPuestos,
        assignPuesto,
        removePuesto
    }
}