import type { AgroModule, Column, Filter } from '~/types/agro'

const columns = (...pairs: string[]): Column[] =>
  pairs.map((pair) => {
    const [key, label] = pair.split('|')
    return { key: key!, label: label! }
  })
const parcela: Filter = {
  key: 'parcelaId',
  label: 'Parcela',
  source: 'parcelas'
}
const activo: Filter = {
  key: 'activo',
  label: 'Activo',
  options: ['true', 'false']
}
const dates: Filter[] = [
  { key: 'desde', label: 'Desde', type: 'date' },
  { key: 'hasta', label: 'Hasta', type: 'date' }
]
const simulated
  = 'El backend actual genera predicciones y análisis mediante simulaciones. No equivalen a resultados de un modelo IA validado.'
export const agroModules: AgroModule[] = [
  {
    key: 'parcelas',
    title: 'Parcelas',
    icon: 'i-lucide-map',
    description: 'Tus parcelas propias y compartidas.',
    endpoint: 'parcelas',
    paginated: true,
    detail: true,
    filters: [
      { key: 'search', label: 'Nombre o código', type: 'text' },
      { key: 'activa', label: 'Activa', options: ['true', 'false'] }
    ],
    columns: columns(
      'nombre|Parcela',
      'codigo|Código',
      'departamento|Departamento',
      'area_hectareas|Área (ha)',
      '_count.cultivos|Cultivos',
      '_count.dispositivos|Dispositivos',
      'activa|Activa'
    )
  },
  {
    key: 'cultivos',
    title: 'Cultivos',
    icon: 'i-lucide-sprout',
    description: 'Variedades, plantas y sistemas de riego.',
    endpoint: 'cultivos',
    paginated: true,
    detail: true,
    filters: [parcela, activo],
    columns: columns(
      'cultivo|Cultivo',
      'variedad|Variedad',
      'parcelas.nombre|Parcela',
      'cantidad_plantas|Plantas',
      'sistema_riego|Sistema de riego',
      'fecha_siembra|Siembra',
      'activo|Activo'
    )
  },
  {
    key: 'dispositivos',
    title: 'Dispositivos',
    icon: 'i-lucide-cpu',
    description: 'Conectividad y estado de los equipos del campo.',
    endpoint: 'dispositivos',
    paginated: true,
    detail: true,
    filters: [
      {
        key: 'estado',
        label: 'Estado',
        options: ['online', 'offline', 'error', 'maintenance']
      },
      activo
    ],
    columns: columns(
      'nombre|Equipo',
      'device_uid|Identificador',
      'parcelas.nombre|Parcela',
      'estado|Estado',
      'bateria_porcentaje|Batería (%)',
      'ultima_conexion|Última conexión'
    )
  },
  {
    key: 'sensores',
    title: 'Sensores',
    icon: 'i-lucide-radio',
    description: 'Sensores instalados, calibración y estadísticas.',
    endpoint: 'sensores',
    paginated: true,
    detail: true,
    filters: [
      { key: 'dispositivoId', label: 'Dispositivo', source: 'dispositivos' },
      activo
    ],
    columns: columns(
      'nombre|Sensor',
      'codigo|Código',
      'tipos_sensor.nombre|Tipo',
      'tipos_sensor.unidad|Unidad',
      'dispositivos.nombre|Dispositivo',
      'offset_calibracion|Calibración',
      'activo|Activo'
    )
  },
  {
    key: 'tipos-sensor',
    title: 'Tipos de sensor',
    icon: 'i-lucide-tags',
    description: 'Catálogo de mediciones y unidades.',
    endpoint: 'sensores/tipos',
    detail: true,
    filters: [],
    columns: columns(
      'nombre|Nombre',
      'codigo|Código',
      'unidad|Unidad',
      'descripcion|Descripción'
    )
  },
  {
    key: 'lecturas',
    title: 'Lecturas',
    icon: 'i-lucide-activity',
    description: 'Historial completo de mediciones. Fechas en hora de Lima.',
    endpoint: 'lecturas',
    paginated: true,
    filters: [
      { key: 'sensorId', label: 'Sensor', source: 'sensores' },
      ...dates
    ],
    columns: columns(
      'sensores.nombre|Sensor',
      'sensores.tipos_sensor.nombre|Medición',
      'valor|Valor',
      'sensores.tipos_sensor.unidad|Unidad',
      'calidad|Calidad (%)',
      'recorded_at|Fecha'
    )
  },
  {
    key: 'riegos',
    title: 'Riegos',
    icon: 'i-lucide-droplets',
    description: 'Historial, duración y consumo registrado.',
    endpoint: 'riegos',
    paginated: true,
    detail: true,
    filters: [
      parcela,
      {
        key: 'estado',
        label: 'Estado',
        options: ['en_curso', 'finalizado', 'cancelado', 'pausado']
      },
      ...dates
    ],
    columns: columns(
      'parcelas.nombre|Parcela',
      'estado|Estado',
      'origen|Origen',
      'inicio|Inicio',
      'duracion_minutos|Duración (min)',
      'volumen_litros|Volumen (L)'
    )
  },
  {
    key: 'alertas',
    title: 'Alertas',
    icon: 'i-lucide-triangle-alert',
    description: 'Incidencias y seguimiento de condiciones del campo.',
    endpoint: 'alertas',
    paginated: true,
    detail: true,
    filters: [
      parcela,
      {
        key: 'estado',
        label: 'Estado',
        options: ['activa', 'atendida', 'resuelta', 'descartada']
      },
      {
        key: 'prioridad',
        label: 'Prioridad',
        options: ['alta', 'media', 'baja']
      }
    ],
    columns: columns(
      'titulo|Alerta',
      'parcelas.nombre|Parcela',
      'prioridad|Prioridad',
      'estado|Estado',
      'valor_detectado|Valor detectado',
      'created_at|Fecha'
    )
  },
  {
    key: 'predicciones',
    title: 'Predicciones',
    icon: 'i-lucide-brain',
    description: 'Resultados almacenados y recomendaciones de riego.',
    endpoint: 'predicciones',
    paginated: true,
    detail: true,
    notice: simulated,
    filters: [parcela, ...dates],
    columns: columns(
      'parcelas.nombre|Parcela',
      'modelos_ia.nombre|Modelo',
      'humedad_predicha|Humedad (%)',
      'tiempo_riego_horas|Riego (h)',
      'volumen_riego_litros|Volumen (L)',
      'confianza|Confianza (%)',
      'created_at|Fecha'
    )
  },
  {
    key: 'modelos-ia',
    title: 'Modelos IA',
    icon: 'i-lucide-network',
    description: 'Versiones registradas y métricas de evaluación.',
    endpoint: 'modelos-ia',
    detail: true,
    filters: [activo],
    columns: columns(
      'nombre|Modelo',
      'version|Versión',
      'algoritmo|Algoritmo',
      'mae|MAE',
      'rmse|RMSE',
      'r2|R²',
      'activo|Activo'
    )
  },
  {
    key: 'reportes',
    title: 'Reportes',
    icon: 'i-lucide-file-chart-column',
    description: 'Reportes y análisis guardados por parcela.',
    endpoint: 'reportes',
    paginated: true,
    detail: true,
    notice: simulated,
    filters: [
      parcela,
      {
        key: 'tipo',
        label: 'Tipo',
        options: [
          'reporte_mensual',
          'reporte_riego',
          'reporte_alertas',
          'reporte_prediccion',
          'reporte_personalizado'
        ]
      },
      ...dates
    ],
    columns: columns(
      'titulo|Reporte',
      'parcelas.nombre|Parcela',
      'tipo|Tipo',
      'formato|Formato',
      'fecha_inicio|Desde',
      'fecha_fin|Hasta',
      'created_at|Registro'
    )
  },
  {
    key: 'notificaciones',
    title: 'Notificaciones',
    icon: 'i-lucide-bell',
    description: 'Avisos personales y estado de lectura.',
    endpoint: 'notificaciones',
    paginated: true,
    filters: [{ key: 'leida', label: 'Leída', options: ['true', 'false'] }],
    columns: columns(
      'titulo|Notificación',
      'mensaje|Mensaje',
      'tipo|Tipo',
      'leida|Leída',
      'created_at|Fecha'
    )
  },
  {
    key: 'configuracion-alertas',
    title: 'Umbrales de alerta',
    icon: 'i-lucide-sliders-horizontal',
    description:
      'Límites de humedad, temperatura, caudal y batería por parcela.',
    endpoint: 'configuracion-alertas',
    filters: [parcela],
    columns: columns(
      'parcelas.nombre|Parcela',
      'humedad_minima|Humedad mín. (%)',
      'humedad_maxima|Humedad máx. (%)',
      'temperatura_maxima|Temperatura máx. (°C)',
      'bateria_minima|Batería mín. (%)',
      'notificaciones_activas|Avisos activos'
    )
  }
]
