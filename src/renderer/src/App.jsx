import { useState } from 'react'
import Navigation from './components/Navigation'
import Timer from './components/Timer'
import MotivationalQuote from './components/MotivationalQuote'
import TodoList from './components/TodoList'
import Statistics from './components/Statistics'
import Settings from './components/Settings'
import useTodos from './hooks/useTodos'
import useTimer from './hooks/useTimer'

const App = () => {
  const { todos, completedCount, totalCount, addTodo, deleteTodo, advanceStatus, clearCompleted } = useTodos()
  const timer = useTimer()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeView, setActiveView] = useState('timer')

  return (
    <div className="app-container">
      <Navigation
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {activeView === 'timer' ? (
        <>
          <Timer {...timer} />
          <MotivationalQuote />
          <TodoList
            todos={todos}
            completedCount={completedCount}
            totalCount={totalCount}
            onAdd={addTodo}
            onDelete={deleteTodo}
            onAdvanceStatus={advanceStatus}
            onClearCompleted={clearCompleted}
          />
        </>
      ) : (
        <Statistics />
      )}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
