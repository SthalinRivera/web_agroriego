import definitions from './agro-forms.json' with { type: 'json' }
import type { AgroRecord } from '~/types/agro'

export interface AgroField {
  key: string
  readKey: string
  label: string
  type: string
  required: boolean
  source?: string
  options?: string[]
  min?: number
  max?: number
  maxLength?: number
  step?: number
}
export const formDefinitions = definitions as Record<string, AgroField[][]>
export function formPayload(
  fields: AgroField[],
  values: AgroRecord
): AgroRecord {
  const body: AgroRecord = {}
  for (const field of fields) {
    const raw = values[field.key]
    if (raw === '' || raw === undefined || raw === null) {
      if (field.required) throw new Error(`Completa ${field.label}.`)
      continue
    }
    const value = typeof raw === 'string' ? raw.trim() : raw
    if (field.required && value === '')
      throw new Error(`Completa ${field.label}.`)
    if (field.type === 'number') {
      const number = Number(value)
      if (
        !Number.isFinite(number)
        || (field.min !== undefined && number < field.min)
        || (field.max !== undefined && number > field.max)
        || (field.step === 1 && !Number.isInteger(number))
      )
        throw new Error(`Revisa el valor de ${field.label}.`)
      body[field.key] = number
    } else if (field.type === 'boolean')
      body[field.key] = value === true || value === 'true'
    else if (field.type === 'json' || field.type === 'array') {
      let parsed: unknown
      try {
        parsed = JSON.parse(String(value))
      } catch {
        throw new Error(`${field.label}: escribe un JSON válido.`)
      }
      if (
        field.type === 'array'
          ? !Array.isArray(parsed)
          || parsed.some(item => typeof item !== 'string')
          : !parsed || typeof parsed !== 'object' || Array.isArray(parsed)
      )
        throw new Error(`${field.label}: formato incorrecto.`)
      body[field.key] = parsed
    } else
      body[field.key]
        = field.type === 'datetime-local' ? `${value}:00-05:00` : value
  }
  for (const [min, max] of [
    ['humedadMinima', 'humedadMaxima'],
    ['temperaturaMinima', 'temperaturaMaxima'],
    ['humedadRelativaMinima', 'humedadRelativaMaxima'],
    ['caudalMinimoLmin', 'caudalMaximoLmin'],
    ['valorMinimo', 'valorMaximo'],
    ['fechaInicio', 'fechaFin']
  ]) {
    if (
      body[min!] !== undefined
      && body[max!] !== undefined
      && body[min!]! > body[max!]!
    )
      throw new Error(
        'El valor inicial o mínimo debe ser menor o igual al final o máximo.'
      )
  }
  return body
}
