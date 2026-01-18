const MODES = {
  focus: { duration: 25 * 60, label: 'Rumo 🚀', color: '#e74c3c' },
  shortBreak: { duration: 5 * 60, label: 'Pausa curta', color: '#27ae60' },
  longBreak: { duration: 15 * 60, label: 'Pausa longa', color: '#3498db' }
}

const CYCLES_BEFORE_LONG_BREAK = 4

const createTimer = ({ onTick, onComplete }) => {
  const state = {
    mode: 'focus',
    endTimestamp: null,
    pausedTimeRemaining: MODES.focus.duration,
    isRunning: false,
    completedCycles: 0
  }

  let intervalId = null

  const getTimeLeft = () => {
    if (!state.isRunning || !state.endTimestamp) {
      return state.pausedTimeRemaining
    }
    return Math.max(0, Math.ceil((state.endTimestamp - Date.now()) / 1000))
  }

  const getState = () => ({
    mode: state.mode,
    timeLeft: getTimeLeft(),
    isRunning: state.isRunning,
    completedCycles: state.completedCycles,
    currentMode: MODES[state.mode],
    cyclesInCurrentSet: state.completedCycles % CYCLES_BEFORE_LONG_BREAK
  })

  const handleComplete = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    state.isRunning = false
    state.endTimestamp = null

    const previousMode = state.mode

    if (state.mode === 'focus') {
      state.completedCycles += 1
      const isLongBreak = state.completedCycles % CYCLES_BEFORE_LONG_BREAK === 0
      state.mode = isLongBreak ? 'longBreak' : 'shortBreak'
    } else {
      state.mode = 'focus'
    }

    state.pausedTimeRemaining = MODES[state.mode].duration

    onComplete({
      ...getState(),
      previousMode
    })
  }

  const tick = () => {
    const timeLeft = getTimeLeft()

    if (timeLeft <= 0 && state.isRunning) {
      handleComplete()
      return
    }

    onTick(getState())
  }

  const start = () => {
    if (state.isRunning) return getState()

    state.endTimestamp = Date.now() + state.pausedTimeRemaining * 1000
    state.isRunning = true
    intervalId = setInterval(tick, 1000)
    tick()
    return getState()
  }

  const pause = () => {
    if (!state.isRunning) return getState()

    state.pausedTimeRemaining = getTimeLeft()
    state.endTimestamp = null
    state.isRunning = false

    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }

    return getState()
  }

  const toggle = () => {
    if (state.isRunning) {
      return pause()
    }
    return start()
  }

  const reset = () => {
    pause()
    state.pausedTimeRemaining = MODES[state.mode].duration
    return getState()
  }

  const switchMode = (newMode) => {
    pause()
    state.mode = newMode
    state.pausedTimeRemaining = MODES[newMode].duration
    return getState()
  }

  return {
    getState,
    toggle,
    reset,
    switchMode
  }
}

export { createTimer, MODES }
