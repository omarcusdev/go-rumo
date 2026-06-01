import { describe, it, expect } from 'vitest'
import { formatActiveShort, weekdayLabel } from './activeTime.js'

describe('formatActiveShort', () => {
  it('formats minutes only under an hour', () => {
    expect(formatActiveShort(0)).toBe('0m')
    expect(formatActiveShort(24 * 60)).toBe('24m')
  })
  it('formats hours and padded minutes with a space', () => {
    expect(formatActiveShort(3 * 3600 + 24 * 60)).toBe('3h 24m')
    expect(formatActiveShort(3600)).toBe('1h 00m')
  })
})

describe('weekdayLabel', () => {
  it('returns the Portuguese weekday initial for a local date key', () => {
    expect(weekdayLabel('2026-06-07')).toBe('D') // Sunday
    expect(weekdayLabel('2026-06-08')).toBe('S') // Monday
  })
})
