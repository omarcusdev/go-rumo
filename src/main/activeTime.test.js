import { describe, it, expect } from 'vitest'
import { formatActive, composeTrayTitle } from './activeTime.js'

describe('formatActive', () => {
  it('shows 0m at the start of the day', () => {
    expect(formatActive(0)).toBe('0m')
  })
  it('shows minutes only under an hour', () => {
    expect(formatActive(24 * 60)).toBe('24m')
    expect(formatActive(59 * 60 + 59)).toBe('59m')
  })
  it('shows hours and zero-padded minutes at or above an hour', () => {
    expect(formatActive(3600)).toBe('1h00m')
    expect(formatActive(3 * 3600 + 24 * 60)).toBe('3h24m')
    expect(formatActive(2 * 3600 + 4 * 60)).toBe('2h04m')
  })
  it('never goes negative', () => {
    expect(formatActive(-50)).toBe('0m')
  })
})

describe('composeTrayTitle', () => {
  it('shows only active time when the timer is not running', () => {
    expect(composeTrayTitle(3 * 3600 + 24 * 60, null)).toBe('3h24m')
  })
  it('appends the countdown when the timer is running', () => {
    expect(composeTrayTitle(3 * 3600 + 24 * 60, '25:00')).toBe('3h24m · 25:00')
  })
  it('treats an empty timer string as not running', () => {
    expect(composeTrayTitle(0, '')).toBe('0m')
  })
})
