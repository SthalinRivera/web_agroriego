import type { AgroRecord } from '~/types/agro'

export function valueAt(row: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object'
          ? (value as AgroRecord)[key]
          : undefined,
      row
    )
}
export function labelFor(key: string): string {
  const labels: Record<string, string> = {
    created_at: 'Fecha de registro',
    updated_at: 'Última actualización',
    recorded_at: 'Fecha de lectura',
    full_name: 'Nombre completo',
    profiles: 'Responsable',
    device_logs: 'Eventos del dispositivo',
    output_data: 'Resultado',
    _count: 'Totales',
    ultimaLectura: 'Última lectura',
    ultimaPrediccion: 'Última predicción',
    alertasActivas: 'Alertas activas',
    riegoActual: 'Riego en curso',
    area_hectareas: 'Área (ha)',
    valor: 'Valor',
    read_at: 'Fecha de lectura de notificación'
  }
  return (
    labels[key]
    ?? key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, c => c.toUpperCase())
  )
}
export function displayValue(value: unknown, key = ''): string {
  const dateOnlyFields = ['fecha_siembra', 'fecha_inicio', 'fecha_fin', 'fecha_instalacion', 'fecha_calibracion']
  if (typeof value === 'string' && dateOnlyFields.includes(key.split('.').at(-1) ?? '') && /^\d{4}-\d\d-\d\d/.test(value)) {
    const date = new Date(value.slice(0, 10) + 'T00:00:00Z')
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
  }
  if (value === null || value === undefined || value === '') return 'Sin dato'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'number')
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(
      value
    )
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `${value.length} registros`
    const obj = value as AgroRecord
    return String(
      obj.nombre ?? obj.titulo ?? obj.codigo ?? obj.id ?? 'Detalle'
    )
  }
  const text = String(value)
  if (/^\d{4}-\d\d-\d\dT/.test(text) && !Number.isNaN(Date.parse(text)))
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Lima'
    }).format(new Date(text))
  return text.replace(/_/g, ' ')
}
export function errorText(cause: unknown): string {
  const error = cause as {
    statusCode?: number
    data?: { message?: unknown }
    message?: string
  }
  if (error.statusCode === 401)
    return 'La sesión venció. Vuelve a iniciar sesión.'
  if (error.statusCode === 403)
    return 'No tienes permiso para consultar estos datos.'
  if (error.statusCode === 404) return 'El registro solicitado no existe.'
  if (error.statusCode === 400 && error.data?.message)
    return Array.isArray(error.data.message)
      ? error.data.message.join('. ')
      : String(error.data.message)
  return 'No se pudieron cargar los datos. Comprueba la conexión con la API e inténtalo nuevamente.'
}
