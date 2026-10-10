export interface Fruta {
    id_fruta: number;
    id_empresa: number;
    nombre: string;
    descripcion?: string | null;
    estado: boolean;
    created_at?: string;
    empresas?: { id_empresa: number; razon_social: string };
    variedades?: any[];
}