import { useState, useEffect, useCallback } from 'react'

const MODES = {
  focus: { duration: 25 * 60, label: 'Rumo 🚀', color: '#e74c3c' },
  shortBreak: { duration: 5 * 60, label: 'Pausa curta', color: '#27ae60' },
  longBreak: { duration: 15 * 60, label: 'Pausa longa', color: '#3498db' }
}

const CYCLES_BEFORE_LONG_BREAK = 4

const useTimer = () => {
  const [state, setState] = useState({
    mode: 'focus',
    timeLeft: MODES.focus.duration,
    isRunning: false,
    completedCycles: 0,
    currentMode: MODES.focus,
    cyclesInCurrentSet: 0
  })

  const playSound = useCallback(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    oscillator.stop(audioContext.currentTime + 0.5)

    setTimeout(() => audioContext.close(), 600)
  }, [])

  useEffect(() => {
    window.api.timerGetState().then((initialState) => {
      if (initialState) {
        setState(initialState)
      }
    })
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onTimerTick((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onTimerComplete((newState) => {
      setState(newState)
      playSound()
    })
    return unsubscribe
  }, [playSound])

  const toggle = useCallback(async () => {
    const newState = await window.api.timerToggle()
    if (newState) {
      setState(newState)
    }
  }, [])

  const reset = useCallback(async () => {
    const newState = await window.api.timerReset()
    if (newState) {
      setState(newState)
    }
  }, [])

  const switchMode = useCallback(async (newMode) => {
    const newState = await window.api.timerSwitchMode(newMode)
    if (newState) {
      setState(newState)
    }
  }, [])

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const progress = 1 - state.timeLeft / state.currentMode.duration

  return {
    mode: state.mode,
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    completedCycles: state.completedCycles,
    currentMode: state.currentMode,
    progress,
    formattedTime: formatTime(state.timeLeft),
    toggle,
    reset,
    switchMode,
    cyclesInCurrentSet: state.completedCycles % CYCLES_BEFORE_LONG_BREAK
  }
}

export default useTimer
