import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createActivityTracker } from './activity.js'

const makeTracker = (overrides = {}) => {
  const fake = { idle: 0, date: new Date(2026, 5, 7, 9, 0, 0), saved: null }
  const tracker = createActivityTracker({
    onUpdate: overrides.onUpdate ?? (() => {}),
    getIdleSeconds: () => fake.idle,
    now: () => fake.date,
    loadDays: () => overrides.initial ?? {},
    saveDays: (days) => {
      fake.saved = days
    },
    idleThresholdSeconds: 300,
    tickMs: 30000,
    retentionDays: 90
  })
  return { tracker, fake }
}

describe('createActivityTracker', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('accumulates active ticks (idle under threshold)', () => {
    const { tracker, fake } = makeTracker()
    fake.idle = 10
    tracker.start()
    vi.advanceTimersByTime(30000)
    expect(tracker.getToday()).toBe(30)
    vi.advanceTimersByTime(30000)
    expect(tracker.getToday()).toBe(60)
  })

  it('does not accumulate while idle past the threshold', () => {
    const { tracker, fake } = makeTracker()
    fake.idle = 400
    tracker.start()
    vi.advanceTimersByTime(30000 * 3)
    expect(tracker.getToday()).toBe(0)
  })

  it('starts a fresh count after midnight rollover', () => {
    const { tracker, fake } = makeTracker()
    fake.idle = 0
    tracker.start()
    vi.advanceTimersByTime(30000) // counts on 06-07
    expect(tracker.getToday()).toBe(30)
    fake.date = new Date(2026, 5, 8, 0, 0, 30) // now it is 06-08
    vi.advanceTimersByTime(30000)
    expect(tracker.getToday()).toBe(30) // new day starts at 30, not 60
    expect(tracker.getHistory(2)).toEqual([
      { dayKey: '2026-06-07', seconds: 30 },
      { dayKey: '2026-06-08', seconds: 30 }
    ])
  })

  it('restores accumulated time from storage on restart', () => {
    const { tracker } = makeTracker({ initial: { '2026-06-07': 600 } })
    expect(tracker.getToday()).toBe(600)
  })

  it('does not overcount across a sleep gap (fixed increment, not wall-clock)', () => {
    const { tracker, fake } = makeTracker()
    fake.idle = 0
    tracker.start()
    vi.advanceTimersByTime(30000) // +30s
    fake.date = new Date(2026, 5, 7, 10, 0, 30) // simulate waking 1h later
    vi.advanceTimersByTime(30000) // first tick after wake adds only 30s
    expect(tracker.getToday()).toBe(60) // not 3600+
  })

  it('pushes onUpdate with today and dayKey', () => {
    const updates = []
    const { tracker, fake } = makeTracker({ onUpdate: (p) => updates.push(p) })
    fake.idle = 0
    tracker.start()
    vi.advanceTimersByTime(30000)
    const last = updates[updates.length - 1]
    expect(last.dayKey).toBe('2026-06-07')
    expect(last.today).toBe(30)
  })

  it('persists on each tick', () => {
    const { tracker, fake } = makeTracker()
    fake.idle = 0
    tracker.start()
    vi.advanceTimersByTime(30000)
    expect(fake.saved['2026-06-07']).toBe(30)
  })
})
