import { useState } from 'react'
import TitleBar from './components/TitleBar'
import Timer from './components/Timer'
import MotivationalQuote from './components/MotivationalQuote'
import TodoList from './components/TodoList'
import Settings from './components/Settings'
import useTodos from './hooks/useTodos'

const App = () => {
  const { todos, completedCount, totalCount, addTodo, deleteTodo, advanceStatus } = useTodos()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="app-container">
      <TitleBar onOpenSettings={() => setSettingsOpen(true)} />
      <Timer />
      <MotivationalQuote />
      <TodoList
        todos={todos}
        completedCount={completedCount}
        totalCount={totalCount}
        onAdd={addTodo}
        onDelete={deleteTodo}
        onAdvanceStatus={advanceStatus}
      />
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
