import { readFileSync, writeFileSync } from 'node:fs'

const specs = {
  'parcelas': ['parcelas', 'CreateParcelaDto', 'UpdateParcelaDto'],
  'cultivos': ['cultivos', 'CreateCultivoDto', 'UpdateCultivoDto'],
  'dispositivos': [
    'dispositivos',
    'CreateDispositivoDto',
    'UpdateDispositivoDto'
  ],
  'sensores': ['sensores', 'CreateSensorDto', 'UpdateSensorDto'],
  'tipos-sensor': ['sensores', 'CreateTipoSensorDto'],
  'lecturas': ['lecturas', 'CreateLecturaDto'],
  'riegos': ['riegos', 'CreateRiegoDto', 'UpdateRiegoDto'],
  'alertas': ['alertas', 'CreateAlertaDto'],
  'predicciones': ['predicciones', 'PredictInputDto'],
  'reportes': ['reportes', 'CreateReporteDto'],
  'modelos-ia': ['modelos-ia', 'CreateModeloIADto', 'UpdateModeloIADto'],
  'configuracion-alertas': [
    'configuracion-alertas',
    'UpsertConfiguracionAlertaDto',
    'UpsertConfiguracionAlertaDto'
  ],
  'finalizar': ['riegos', 'FinalizarRiegoDto'],
  'calibrar': ['sensores', 'CalibrarSensorDto'],
  'atender': ['alertas', 'AtenderAlertaDto']
}
const sources = {
  parcelaId: 'parcelas',
  dispositivoId: 'dispositivos',
  sensorId: 'sensores',
  tipoSensorId: 'sensores/tipos',
  modeloId: 'modelos-ia'
}
const labels = {
  parcelaId: 'Parcela',
  dispositivoId: 'Dispositivo',
  sensorId: 'Sensor',
  tipoSensorId: 'Tipo de sensor',
  modeloId: 'Modelo IA',
  deviceUid: 'Identificador del equipo',
  areaHectareas: 'Área (ha)',
  altitudMsnm: 'Altitud (m s. n. m.)',
  cantidadPlantas: 'Cantidad de plantas',
  edadPromedioAnios: 'Edad promedio (años)',
  humedadSuelo: 'Humedad del suelo (%)',
  humedadRelativa: 'Humedad relativa (%)',
  temperatura: 'Temperatura (°C)',
  caudalLmin: 'Caudal (L/min)',
  offset: 'Ajuste de calibración',
  notificacionesActivas: 'Notificaciones activas',
  dispositivoOfflineMinutos: 'Minutos sin conexión',
  recordedAt: 'Fecha de lectura (hora de Lima)'
}
const result = {}
for (const [key, [folder, ...classes]] of Object.entries(specs)) {
  const source = readFileSync(
    `../api-agrotec/src/modules/${folder}/${folder}.dto.ts`,
    'utf8'
  )
  result[key] = classes.map((name) => {
    const body = source.split(`export class ${name} {`)[1].split(/^}/m)[0]
    return [...body.matchAll(/((?:\s*@[^\n]+\n)+)\s*(\w+)[!?]?:\s*([^;\n]+);/g)]
      .map(([, decorators, name, type]) => {
        const field = {
          key: name,
          readKey: name.replace(/[A-Z]/g, c => '_' + c.toLowerCase()),
          label:
            labels[name]
            || name
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/^./, c => c.toUpperCase()),
          type: /IsBoolean/.test(decorators)
            ? 'boolean'
            : /IsNumber|IsInt/.test(decorators)
              ? 'number'
              : /Record</.test(type)
                ? 'json'
                : /string\[\]/.test(type)
                  ? 'array'
                  : /IsDateString/.test(decorators)
                    || name === 'fechaCalibracion'
                    ? name === 'recordedAt'
                      ? 'datetime-local'
                      : 'date'
                    : [
                        'descripcion',
                        'observaciones',
                        'mensaje',
                        'accion'
                      ].includes(name)
                        ? 'textarea'
                        : 'text',
          required: !decorators.includes('@IsOptional')
        }
        if (sources[name]) field.source = sources[name]
        const options = decorators.match(/@IsIn\(\[([^\]]+)\]/)
        if (options)
          field.options = [...options[1].matchAll(/'([^']+)'/g)].map(
            m => m[1]
          )
        const enumName = decorators.match(/@IsEnum\((\w+)\)/)?.[1]
        if (enumName)
          field.options = [
            ...source
              .split(`export enum ${enumName} {`)[1]
              .split('}')[0]
              .matchAll(/'([^']+)'/g)
          ].map(m => m[1])
        for (const [decorator, prop] of [
          ['Min', 'min'],
          ['Max', 'max']
        ]) {
          const m = decorators.match(
            new RegExp('@' + decorator + '\\((-?[\\d.]+)\\)')
          )
          if (m) field[prop] = Number(m[1])
        }
        const length = decorators.match(/@Length\((\d+),\s*(\d+)\)/)
        if (length) field.maxLength = Number(length[2])
        if (
          /IsInt/.test(decorators)
          || [
            'cantidadPlantas',
            'diasDesdeUltimoRiego',
            'duracionMinutos',
            'dispositivoOfflineMinutos'
          ].includes(name)
        )
          field.step = 1
        return field
      })
      .filter(field => field.key !== 'secretHash')
  })
}
Object.assign(
  result,
  JSON.parse(readFileSync('app/utils/agro-forms-extra.json', 'utf8'))
)
writeFileSync(
  'app/utils/agro-forms.json',
  JSON.stringify(result, null, 2) + '\n'
)
