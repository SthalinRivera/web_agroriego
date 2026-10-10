export type AgroRecord = Record<string, unknown>
export interface PageResult { data: AgroRecord[], meta: { total: number, page: number, limit: number, totalPages: number } }
export interface Column { key: string, label: string }
export interface Filter { key: string, label: string, options?: string[], source?: string, type?: 'date' | 'text' }
export interface AgroModule { key: string, title: string, icon: string, description: string, endpoint: string, paginated?: boolean, detail?: boolean, filters: Filter[], columns: Column[], notice?: string }
