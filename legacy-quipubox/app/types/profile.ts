export interface UserProfile {
    id: number
    email: string
    nombres: string
    apellidos: string
    telefono: string | null
    avatar_url: string | null
    estado_acceso: string
    created_at: string
    rol: {
        id: number
        nombre: string
        descripcion: string | null
    } | null
    sede: {
        id: number
        nombre: string
        tipo_sede: string | null
        ciudad: string | null
        departamento: string | null
    } | null
}