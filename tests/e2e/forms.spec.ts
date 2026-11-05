import { test, expect } from '@playwright/test'
import { formDefinitions, formPayload } from '../../app/utils/agro-forms'

test('form validation retains false and zero, rejects reversed thresholds and malformed JSON', () => {
  expect(
    formPayload(formDefinitions['configuracion-alertas']![0]!, {
      parcelaId: 'parcel-id',
      humedadMinima: 0,
      humedadMaxima: 80,
      notificacionesActivas: false
    })
  ).toEqual({
    parcelaId: 'parcel-id',
    humedadMinima: 0,
    humedadMaxima: 80,
    notificacionesActivas: false
  })
  expect(() =>
    formPayload(formDefinitions['configuracion-alertas']![0]!, {
      parcelaId: 'parcel-id',
      humedadMinima: 90,
      humedadMaxima: 20
    })
  ).toThrow('mínimo')
  expect(() =>
    formPayload(formDefinitions.sensores![0]!, {
      dispositivoId: 'device-id',
      tipoSensorId: 1,
      metadata: '[]'
    })
  ).toThrow('formato incorrecto')
  expect(() =>
    formPayload(formDefinitions.cultivos![0]!, {
      parcelaId: 'parcel-id',
      cantidadPlantas: 1.5
    })
  ).toThrow('Revisa')
})
