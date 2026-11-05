export interface AuthProfile {
  id: string
  email: string
  nombres: string
  apellidos: string
  estado: boolean
  roles: { id: number, nombre: string, codigo?: string, descripcion: string | null }[]
}
