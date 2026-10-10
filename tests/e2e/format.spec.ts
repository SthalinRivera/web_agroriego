import { test, expect } from '@playwright/test'
import { displayValue } from '../../app/utils/agro'
test('calendar dates retain their day while measurements use Lima time', () => {
  const instant = '2020-03-15T00:00:00.000Z'
  expect(displayValue(instant, 'fecha_siembra')).toContain('15')
  expect(displayValue(instant, 'fecha_inicio')).toContain('15')
  expect(displayValue(instant, 'recorded_at')).toContain('14')
})
