export interface Variedad {
    id_variedad: number;
    id_empresa: number;
    id_fruta: number;
    nombre: string;
    descripcion?: string | null;
    estado: boolean;
    created_at?: string;
    frutas?: { id_fruta: number; nombre: string };
    empresas?: { id_empresa: number; razon_social: string };
}