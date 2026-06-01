# Active Hours Menu Bar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show today's active Mac usage time fixed in the macOS menu bar (alongside the Pomodoro countdown when running) and a 7-day history in the existing Statistics view.

**Architecture:** A main-process `createActivityTracker` (closure factory, injected dependencies) ticks every 30s and, when the system has been idle < 5 min, adds a fixed increment to a per-day seconds map persisted in electron-store. A single pure `composeTrayTitle` drives `tray.setTitle`, merging active time (always) with the timer countdown (only while running), ending the current contention for the tray title. The renderer reads the data over IPC and renders a "Tempo ativo" block reusing a lightly generalized `StatisticsChart`.

**Tech Stack:** Electron 39, React 19, electron-store, electron-vite, electron `powerMonitor`, vitest (new, for pure-logic tests).

Spec: `docs/superpowers/specs/2026-06-01-active-hours-menubar-design.md`

---

## File Structure

**New files:**
- `src/main/activeTime.js` — pure helpers: `dayKey`, `formatActive` (compact, menu bar), `composeTrayTitle`, `buildHistory`. No Electron imports → unit-testable.
- `src/main/activity.js` — `createActivityTracker({ onUpdate, getIdleSeconds, now, loadDays, saveDays, ... })`. Closure factory, deps injected → unit-testable.
- `src/renderer/src/lib/activeTime.js` — pure renderer helpers: `formatActiveShort` (spaced, UI), `weekdayLabel`.
- `src/renderer/src/hooks/useActiveHours.js` — loads today + 7-day history, subscribes to live updates.
- `src/renderer/src/components/ActiveHours.jsx` — "Tempo ativo" block (today + 7-day chart).
- `vitest.config.mjs` — node-environment test config.
- Tests: `src/main/activeTime.test.js`, `src/main/activity.test.js`, `src/renderer/src/lib/activeTime.test.js`.

**Modified files:**
- `src/main/index.js` — wire tracker, tray composer, IPC; remove dead `update-tray-title`.
- `src/preload/index.js` — add `getActiveToday`/`getActiveHistory`/`onActiveUpdate`; remove dead `updateTrayTitle`.
- `src/renderer/src/components/StatisticsChart.jsx` — add optional `formatValue`/`formatTooltipLabel` props (defaults preserve rumos behavior).
- `src/renderer/src/components/Statistics.jsx` — render `<ActiveHours />`.
- `src/renderer/src/assets/main.css` — styles for the block.
- `package.json` — add vitest devDependency + `test`/`test:watch` scripts.

**Tray title contention (resolved):** Today `tray.setTitle` is written in three places (initial `'25:00'`, timer `onTick`, and the dead `update-tray-title` IPC). After this plan, exactly one function (`renderTrayTitle`) writes the title, composing two module variables: `activeSecondsToday` (from the tracker) and `timerString` (from the timer, `null` when not running).

---

## Task 1: Vitest setup + `formatActive`

**Files:**
- Create: `vitest.config.mjs`
- Modify: `package.json`
- Create: `src/main/activeTime.js`
- Test: `src/main/activeTime.test.js`

- [ ] **Step 1: Add vitest and test scripts**

Run:
```bash
pnpm add -D vitest
```

Then edit `package.json` — add two scripts to the `"scripts"` block (after `"lint"`):
```json
    "lint": "eslint --cache .",
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 2: Create the vitest config**

Create `vitest.config.mjs`:
```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js']
  }
})
```

- [ ] **Step 3: Write the failing test**

Create `src/main/activeTime.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { formatActive } from './activeTime.js'

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
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./activeTime.js"` (the module does not exist yet).

- [ ] **Step 5: Implement `formatActive`**

Create `src/main/activeTime.js`:
```js
const pad2 = (n) => String(n).padStart(2, '0')

// Compact label for the macOS menu bar: "3h04m" / "24m" / "0m".
export const formatActive = (seconds) => {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  return hours > 0 ? `${hours}h${pad2(mins)}m` : `${mins}m`
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — 1 test file, 4 tests passing.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.mjs src/main/activeTime.js src/main/activeTime.test.js
git commit -m "test: add vitest and formatActive helper for the menu bar"
```

---

## Task 2: `composeTrayTitle`

**Files:**
- Modify: `src/main/activeTime.js`
- Test: `src/main/activeTime.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/main/activeTime.test.js`:
```js
import { composeTrayTitle } from './activeTime.js'

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
```

> Note: the separator is a middle dot `·` (U+00B7) with a space on each side.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `composeTrayTitle is not a function` / import has no such export.

- [ ] **Step 3: Implement `composeTrayTitle`**

Add to `src/main/activeTime.js` (below `formatActive`):
```js
// Menu bar title: active time is always shown; the countdown is appended only while running.
export const composeTrayTitle = (activeSeconds, timerString) => {
  const active = formatActive(activeSeconds)
  return timerString ? `${active} · ${timerString}` : active
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — all `formatActive` and `composeTrayTitle` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/main/activeTime.js src/main/activeTime.test.js
git commit -m "feat: compose menu bar title from active time and countdown"
```

---

## Task 3: `dayKey` + `buildHistory`

**Files:**
- Modify: `src/main/activeTime.js`
- Test: `src/main/activeTime.test.js`

- [ ] **Step 1: Write the failing test**

Append to `src/main/activeTime.test.js`:
```js
import { dayKey, buildHistory } from './activeTime.js'

describe('dayKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    // Month is 0-based: 5 = June.
    expect(dayKey(new Date(2026, 5, 1))).toBe('2026-06-01')
    expect(dayKey(new Date(2026, 0, 9))).toBe('2026-01-09')
  })
})

describe('buildHistory', () => {
  const today = new Date(2026, 5, 7) // 2026-06-07

  it('returns `days` entries ordered oldest to newest ending today', () => {
    const series = buildHistory({}, 7, today)
    expect(series).toHaveLength(7)
    expect(series[0].dayKey).toBe('2026-06-01')
    expect(series[6].dayKey).toBe('2026-06-07')
  })

  it('fills missing days with zero seconds', () => {
    const series = buildHistory({ '2026-06-07': 120 }, 3, today)
    expect(series).toEqual([
      { dayKey: '2026-06-05', seconds: 0 },
      { dayKey: '2026-06-06', seconds: 0 },
      { dayKey: '2026-06-07', seconds: 120 }
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `dayKey`/`buildHistory` are not exported.

- [ ] **Step 3: Implement `dayKey` and `buildHistory`**

Add to `src/main/activeTime.js` (below `composeTrayTitle`):
```js
// Local calendar day key 'YYYY-MM-DD' (matches the day boundary used by the stats view).
export const dayKey = (date) => {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

// Source-of-truth series: oldest → newest, `days` entries ending at `today`,
// missing days filled with `seconds: 0`. secondsByDay is a { 'YYYY-MM-DD': number } map.
export const buildHistory = (secondsByDay, days, today) => {
  const series = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const key = dayKey(date)
    series.push({ dayKey: key, seconds: secondsByDay[key] ?? 0 })
  }
  return series
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — `dayKey` and `buildHistory` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/main/activeTime.js src/main/activeTime.test.js
git commit -m "feat: add dayKey and gap-filled history builder"
```

---

## Task 4: `createActivityTracker`

**Files:**
- Create: `src/main/activity.js`
- Test: `src/main/activity.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/main/activity.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./activity.js"`.

- [ ] **Step 3: Implement `createActivityTracker`**

Create `src/main/activity.js`:
```js
import { dayKey, buildHistory } from './activeTime.js'

// Tracks active Mac usage per local day. Active = system idle time below a threshold.
// All side-effecting dependencies are injected so the core is testable without Electron.
export const createActivityTracker = ({
  onUpdate,
  getIdleSeconds,
  now = () => new Date(),
  loadDays,
  saveDays,
  idleThresholdSeconds = 300,
  tickMs = 30000,
  retentionDays = 90
}) => {
  let secondsByDay = { ...(loadDays?.() ?? {}) }
  let intervalId = null

  const prune = () => {
    const allowed = new Set(buildHistory({}, retentionDays, now()).map((entry) => entry.dayKey))
    secondsByDay = Object.fromEntries(
      Object.entries(secondsByDay).filter(([key]) => allowed.has(key))
    )
  }

  const getToday = () => secondsByDay[dayKey(now())] ?? 0
  const getHistory = (days = 7) => buildHistory(secondsByDay, days, now())

  // Adds a FIXED increment (tickMs), never a wall-clock delta. During sleep/lock the interval
  // does not fire, so missed time is simply not counted — no catch-up, no overcount on wake.
  const tick = () => {
    const key = dayKey(now())
    if (getIdleSeconds() < idleThresholdSeconds) {
      secondsByDay = { ...secondsByDay, [key]: (secondsByDay[key] ?? 0) + tickMs / 1000 }
    }
    prune()
    saveDays?.(secondsByDay)
    onUpdate?.({ today: secondsByDay[key] ?? 0, dayKey: key })
  }

  const start = () => {
    if (intervalId) return
    // Render the restored value immediately (no increment), then count on each interval.
    onUpdate?.({ today: getToday(), dayKey: dayKey(now()) })
    intervalId = setInterval(tick, tickMs)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return { start, stop, getToday, getHistory }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — all 7 `createActivityTracker` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/main/activity.js src/main/activity.test.js
git commit -m "feat: add activity tracker for active Mac usage"
```

---

## Task 5: Renderer helpers (`formatActiveShort`, `weekdayLabel`)

**Files:**
- Create: `src/renderer/src/lib/activeTime.js`
- Test: `src/renderer/src/lib/activeTime.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/lib/activeTime.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./activeTime.js"` (renderer lib).

- [ ] **Step 3: Implement the helpers**

Create `src/renderer/src/lib/activeTime.js`:
```js
const pad2 = (n) => String(n).padStart(2, '0')

// Readable label for the UI: "3h 24m" / "24m" / "0m".
export const formatActiveShort = (seconds) => {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  return hours > 0 ? `${hours}h ${pad2(mins)}m` : `${mins}m`
}

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Parses 'YYYY-MM-DD' as a LOCAL date (avoids the UTC shift of new Date('YYYY-MM-DD')).
export const weekdayLabel = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return WEEKDAY_INITIALS[new Date(year, month - 1, day).getDay()]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — all `formatActiveShort` and `weekdayLabel` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/lib/activeTime.js src/renderer/src/lib/activeTime.test.js
git commit -m "feat: add renderer formatting helpers for active time"
```

---

## Task 6: Wire the main process (tracker + tray composer + IPC)

**Files:**
- Modify: `src/main/index.js`
- Modify: `src/preload/index.js`

No unit test (Electron integration); verified by `pnpm lint` and a manual smoke run.

- [ ] **Step 1: Update imports in `src/main/index.js`**

Replace the top import block (lines 1-4):
```js
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createTimer } from './timer.js'
```
with:
```js
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage, powerMonitor } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createTimer } from './timer.js'
import { createActivityTracker } from './activity.js'
import { composeTrayTitle } from './activeTime.js'
```

- [ ] **Step 2: Add module state**

Replace:
```js
let store = null
let mainWindow = null
let tray = null
let timer = null
```
with:
```js
let store = null
let mainWindow = null
let tray = null
let timer = null
let tracker = null
let activeSecondsToday = 0
let timerString = null
```

- [ ] **Step 3: Add the tray-title composer helpers**

Immediately after the existing `formatTime` function (the block ending with its closing `}` near line 22), add:
```js
const renderTrayTitle = () => {
  tray?.setTitle(composeTrayTitle(activeSecondsToday, timerString))
}

const syncTimerToTray = (state) => {
  timerString = state?.isRunning ? formatTime(state.timeLeft) : null
  renderTrayTitle()
}
```

- [ ] **Step 4: Use the composer for the initial tray title**

In `createTray`, replace:
```js
  tray.setTitle('25:00')
```
with:
```js
  tray.setTitle(composeTrayTitle(activeSecondsToday, timerString))
```

- [ ] **Step 5: Remove the dead `update-tray-title` IPC handler**

In `setupIPC`, delete this block entirely:
```js
  ipcMain.on('update-tray-title', (_, time) => {
    tray?.setTitle(time)
  })
```

- [ ] **Step 6: Sync the timer handlers with the tray and add active-time IPC**

In `setupIPC`, replace the timer handler block:
```js
  ipcMain.handle('timer:get-state', () => timer?.getState())
  ipcMain.handle('timer:toggle', () => timer?.toggle())
  ipcMain.handle('timer:reset', () => timer?.reset())
  ipcMain.handle('timer:switch-mode', (_, mode) => timer?.switchMode(mode))
```
with:
```js
  ipcMain.handle('timer:get-state', () => timer?.getState())
  ipcMain.handle('timer:toggle', () => {
    const state = timer?.toggle()
    syncTimerToTray(state)
    return state
  })
  ipcMain.handle('timer:reset', () => {
    const state = timer?.reset()
    syncTimerToTray(state)
    return state
  })
  ipcMain.handle('timer:switch-mode', (_, mode) => {
    const state = timer?.switchMode(mode)
    syncTimerToTray(state)
    return state
  })

  ipcMain.handle('get-active-today', () => tracker?.getToday() ?? 0)
  ipcMain.handle('get-active-history', (_, days = 7) => tracker?.getHistory(days) ?? [])
```

- [ ] **Step 7: Drive the tray from the timer ticks (not direct setTitle)**

In `setupTimer`, replace the `onTick` callback:
```js
    onTick: (state) => {
      mainWindow?.webContents.send('timer:tick', state)
      tray?.setTitle(formatTime(state.timeLeft))
    },
```
with:
```js
    onTick: (state) => {
      mainWindow?.webContents.send('timer:tick', state)
      timerString = formatTime(state.timeLeft)
      renderTrayTitle()
    },
```

Then, in the same `setupTimer`, at the END of the `onComplete` callback (just before its closing `}`), add a line to drop the countdown from the bar when a session ends:
```js
      if (state.previousMode === 'focus') {
        const rumos = store?.get('rumos', []) ?? []
        store?.set('rumos', [...rumos, { id: crypto.randomUUID(), timestamp: Date.now() }])
      }

      timerString = null
      renderTrayTitle()
    }
```

- [ ] **Step 8: Add the activity tracker setup**

After the entire `setupTimer` function definition, add:
```js
const setupActivityTracker = () => {
  tracker = createActivityTracker({
    getIdleSeconds: () => powerMonitor.getSystemIdleTime(),
    loadDays: () => store?.get('activeSeconds', {}) ?? {},
    saveDays: (days) => store?.set('activeSeconds', days),
    onUpdate: ({ today, dayKey }) => {
      activeSecondsToday = today
      renderTrayTitle()
      mainWindow?.webContents.send('active:update', { today, dayKey })
    }
  })
  tracker.start()
}
```

- [ ] **Step 9: Start the tracker on app ready and stop it on quit**

In the `app.whenReady().then(...)` body, replace:
```js
  await initStore()
  setupIPC()
  createWindow()
  createTray()
  setupTimer()
```
with:
```js
  await initStore()
  setupIPC()
  createWindow()
  createTray()
  setupTimer()
  setupActivityTracker()

  app.on('before-quit', () => {
    tracker?.stop()
  })
```

- [ ] **Step 10: Update the preload bridge**

In `src/preload/index.js`, inside the `api` object, replace the line:
```js
  updateTrayTitle: (time) => ipcRenderer.send('update-tray-title', time),
```
with:
```js
  getActiveToday: () => ipcRenderer.invoke('get-active-today'),
  getActiveHistory: (days) => ipcRenderer.invoke('get-active-history', days),
  onActiveUpdate: (callback) => {
    const handler = (_, payload) => callback(payload)
    ipcRenderer.on('active:update', handler)
    return () => ipcRenderer.removeListener('active:update', handler)
  },
```

- [ ] **Step 11: Lint and smoke-test**

Run: `pnpm lint`
Expected: PASS (no errors). If ESLint flags an unused var, re-check the edits above.

Run: `pnpm dev`
Expected manual observations (macOS):
- The menu bar shows `0m` (or the restored value) on launch — no longer `25:00`.
- Start the Pomodoro: the bar shows `<active> · 24:59`, counting down.
- Pause/reset the Pomodoro: the countdown disappears; only `<active>` remains.
- After ~30s of normal use, `<active>` increments by `0m`→`1m` as minutes accrue.

- [ ] **Step 12: Commit**

```bash
git add src/main/index.js src/preload/index.js
git commit -m "feat: track active Mac time and show it in the menu bar"
```

---

## Task 7: Renderer UI (hook + block + chart + styles)

**Files:**
- Create: `src/renderer/src/hooks/useActiveHours.js`
- Create: `src/renderer/src/components/ActiveHours.jsx`
- Modify: `src/renderer/src/components/StatisticsChart.jsx`
- Modify: `src/renderer/src/components/Statistics.jsx`
- Modify: `src/renderer/src/assets/main.css`

No unit test (React UI; the spec scopes tests to pure logic); verified by `pnpm lint` and a manual run.

- [ ] **Step 1: Create the `useActiveHours` hook**

Create `src/renderer/src/hooks/useActiveHours.js`:
```js
import { useState, useEffect } from 'react'
import { weekdayLabel } from '../lib/activeTime'

const withLabels = (series) =>
  series.map((entry) => ({ ...entry, label: weekdayLabel(entry.dayKey) }))

const useActiveHours = () => {
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [history, setHistory] = useState([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const today = (await window.api?.getActiveToday?.()) ?? 0
      const series = (await window.api?.getActiveHistory?.(7)) ?? []
      if (!active) return
      setTodaySeconds(today)
      setHistory(withLabels(series))
    }
    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const unsubscribe = window.api?.onActiveUpdate?.((payload) => {
      setTodaySeconds(payload.today)
      setHistory((prev) =>
        prev.map((entry) =>
          entry.dayKey === payload.dayKey ? { ...entry, seconds: payload.today } : entry
        )
      )
    })
    return unsubscribe
  }, [])

  return { todaySeconds, history }
}

export default useActiveHours
```

- [ ] **Step 2: Generalize `StatisticsChart` (defaults preserve rumos behavior)**

In `src/renderer/src/components/StatisticsChart.jsx`, replace the component signature:
```js
const StatisticsChart = ({ data, period, currentDate }) => {
```
with:
```js
const StatisticsChart = ({
  data,
  period,
  currentDate,
  formatValue = (count) => `${count} ${count === 1 ? 'rumo' : 'rumos'}`,
  formatTooltipLabel = (index) => formatTooltipDate(index, period, currentDate)
}) => {
```

Then replace the tooltip content:
```js
          <span className="tooltip-count">
            {hoveredBar.count} {hoveredBar.count === 1 ? 'rumo' : 'rumos'}
          </span>
          <span className="tooltip-date">
            {formatTooltipDate(hoveredBar.index, period, currentDate)}
          </span>
```
with:
```js
          <span className="tooltip-count">{formatValue(hoveredBar.count)}</span>
          <span className="tooltip-date">{formatTooltipLabel(hoveredBar.index)}</span>
```

- [ ] **Step 3: Create the `ActiveHours` block**

Create `src/renderer/src/components/ActiveHours.jsx`:
```jsx
import useActiveHours from '../hooks/useActiveHours'
import StatisticsChart from './StatisticsChart'
import { formatActiveShort } from '../lib/activeTime'

const ActiveHours = () => {
  const { todaySeconds, history } = useActiveHours()
  const data = history.map((entry) => ({ label: entry.label, count: entry.seconds }))

  return (
    <div className="active-hours-section">
      <div className="active-hours-header">
        <span className="active-hours-title">Tempo ativo</span>
        <span className="active-hours-today">{formatActiveShort(todaySeconds)} hoje</span>
      </div>
      <StatisticsChart
        data={data}
        formatValue={formatActiveShort}
        formatTooltipLabel={(index) => history[index]?.label ?? ''}
      />
    </div>
  )
}

export default ActiveHours
```

- [ ] **Step 4: Render the block in the Statistics view**

In `src/renderer/src/components/Statistics.jsx`, add the import after the existing imports:
```js
import StatisticsChart from './StatisticsChart'
import ActiveHours from './ActiveHours'
```
Then render it as the first child of `statistics-section`:
```js
    <div className="statistics-section">
      <ActiveHours />
      <PeriodSelector period={period} onPeriodChange={setPeriod} />
```

- [ ] **Step 5: Add styles**

Append to `src/renderer/src/assets/main.css`:
```css
.active-hours-section {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
}

.active-hours-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.active-hours-title {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: lowercase;
}

.active-hours-today {
  font-size: 16px;
  font-weight: 600;
  color: var(--mode-color);
}
```

- [ ] **Step 6: Lint and smoke-test**

Run: `pnpm lint`
Expected: PASS.

Run: `pnpm dev` → open the Statistics tab (🚀).
Expected manual observations:
- A "Tempo ativo" block appears at the top with "Xh YYm hoje" and a 7-day bar chart (today is the rightmost bar).
- Hovering a bar shows a tooltip like "3h 24m" + the weekday initial.
- The existing Rumos chart below still works unchanged (tooltip still says "N rumos").

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/hooks/useActiveHours.js src/renderer/src/components/ActiveHours.jsx src/renderer/src/components/StatisticsChart.jsx src/renderer/src/components/Statistics.jsx src/renderer/src/assets/main.css
git commit -m "feat: show active hours block with 7-day history in stats"
```

---

## Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: PASS — 3 test files (`src/main/activeTime.test.js`, `src/main/activity.test.js`, `src/renderer/src/lib/activeTime.test.js`), all green.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: PASS, no warnings/errors.

- [ ] **Step 3: Production build sanity**

Run: `pnpm build`
Expected: electron-vite build completes for main/preload/renderer with no errors.

- [ ] **Step 4: End-to-end manual smoke (macOS, `pnpm dev`)**

Verify, in order:
- Launch → menu bar shows active time (not `25:00`).
- Use the Mac normally for ~1 min → value increments.
- Leave it idle > 5 min → value stops increasing; resume input → it resumes.
- Start Pomodoro → `<active> · MM:SS`; pause → countdown gone.
- Statistics tab → "Tempo ativo" block with today + 7-day chart; Rumos chart still intact.
- Quit and relaunch → today's value is restored (not reset).

- [ ] **Step 5: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "chore: verification fixups for active hours feature"
```
(Skip if nothing changed.)

---

## Self-Review

**Spec coverage:**
- Menu bar "show both" → Tasks 2, 6 (`composeTrayTitle` + `renderTrayTitle`/`syncTimerToTray`). ✓
- Active = real usage, 5-min idle, fixed increment, sleep-safe → Task 4 (`createActivityTracker` + tests). ✓
- Per-day persistence keyed by local date, midnight reset, restart restore, ~90d prune → Tasks 3, 4. ✓
- IPC + preload (`get-active-today`, `get-active-history`, `active:update`) → Task 6. ✓
- `useActiveHours` live updates → Task 7 Step 1. ✓
- "Tempo ativo" block in Statistics → Task 7 Steps 3-4. ✓
- `StatisticsChart` generalized without breaking rumos → Task 7 Step 2 (defaults reproduce current output). ✓
- vitest for tracker/formatters/composer/history builder → Tasks 1-5. ✓
- Plain-text menu bar style → `formatActive` returns no icon. ✓
- Functional style (closures, injected deps, pure helpers) → all new modules. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code; every command has expected output. ✓

**Type/name consistency:** `createActivityTracker`, `dayKey`, `buildHistory`, `formatActive`, `composeTrayTitle`, `formatActiveShort`, `weekdayLabel`, `renderTrayTitle`, `syncTimerToTray`, `tracker`, `activeSecondsToday`, `timerString`, IPC channels `get-active-today`/`get-active-history`/`active:update`, and `window.api` methods `getActiveToday`/`getActiveHistory`/`onActiveUpdate` are used identically across the main, preload, and renderer tasks. ✓

**Note on `now()`/`Date.now()`:** Used in normal app/test code (only the Workflow scripting sandbox forbids them); injected `now` in the tracker keeps the core deterministic for tests.
