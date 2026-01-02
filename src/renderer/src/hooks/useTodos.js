import { useState, useEffect, useCallback, useMemo } from 'react'

const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
}

const MAX_IN_PROGRESS = 3

const getNextStatus = (currentStatus) => {
  const flow = {
    [STATUS.PENDING]: STATUS.IN_PROGRESS,
    [STATUS.IN_PROGRESS]: STATUS.COMPLETED,
    [STATUS.COMPLETED]: STATUS.PENDING
  }
  return flow[currentStatus] || STATUS.PENDING
}

const useTodos = () => {
  const [todos, setTodos] = useState([])
  const [focusedTodoId, setFocusedTodoId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadTodos = async () => {
      try {
        if (window.api?.getTodos) {
          const savedTodos = await window.api.getTodos()
          const savedFocusId = await window.api.getFocusedTodoId()
          if (savedTodos) {
            const migratedTodos = savedTodos.map((todo) => ({
              ...todo,
              status: todo.status || (todo.completed ? STATUS.COMPLETED : STATUS.PENDING)
            }))
            setTodos(migratedTodos)
          }
          if (savedFocusId) setFocusedTodoId(savedFocusId)
        }
      } catch (error) {
        console.error('Failed to load todos:', error)
      } finally {
        setIsLoaded(true)
      }
    }
    loadTodos()
  }, [])

  useEffect(() => {
    if (isLoaded && window.api?.saveTodos) {
      window.api.saveTodos(todos)
    }
  }, [todos, isLoaded])

  useEffect(() => {
    if (isLoaded && window.api?.saveFocusedTodoId) {
      window.api.saveFocusedTodoId(focusedTodoId)
    }
  }, [focusedTodoId, isLoaded])

  const addTodo = useCallback((text) => {
    if (!text.trim()) return
    const newTodo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      status: STATUS.PENDING
    }
    setTodos((prev) => [...prev, newTodo])
  }, [])

  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
    setFocusedTodoId((currentFocusId) => (currentFocusId === id ? null : currentFocusId))
  }, [])

  const advanceStatus = useCallback((id) => {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id)
      if (!todo) return prev

      const currentInProgressCount = prev.filter((t) => t.status === STATUS.IN_PROGRESS).length
      const wouldBecomeInProgress = todo.status === STATUS.PENDING

      if (wouldBecomeInProgress && currentInProgressCount >= MAX_IN_PROGRESS) {
        return prev
      }

      return prev.map((t) =>
        t.id === id ? { ...t, status: getNextStatus(t.status) } : t
      )
    })
  }, [])

  const setFocusedTodo = useCallback((id) => {
    setFocusedTodoId((prev) => (prev === id ? null : id))
  }, [])

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.status === STATUS.COMPLETED).length,
    [todos]
  )

  return {
    todos,
    focusedTodoId,
    completedCount,
    totalCount: todos.length,
    addTodo,
    deleteTodo,
    advanceStatus,
    setFocusedTodo,
    STATUS
  }
}

export default useTodos
