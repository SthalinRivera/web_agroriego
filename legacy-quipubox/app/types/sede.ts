export interface Sede {
    id_sede: number
    nombre: string
    tipo_sede: 'origen' | 'destino' | 'ambos' | null
    direccion: string | null
    ciudad: string | null
    departamento: string | null
    telefono: string | null
    estado: boolean
    created_at: string
}